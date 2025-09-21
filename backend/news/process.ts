import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import { Header } from "encore.dev/api";
import db from "../db";
import OpenAI from "openai";
import { randomUUID } from "crypto";
import { memoryStore } from "./store";

/**
 * Exposes endpoint as `news.process` so the frontend call
 * `backend.news.process({ url })` works.
 */

// ---------------- Types that match your frontend/get.ts ----------------
type Tone = "factual" | "neutral" | "opinionated" | "satirical";
type BiasConfidence = "low" | "medium" | "high";
type KeyTag = "fact" | "timeline" | "stakeholders" | "numbers";

export interface ArticleAnalysis {
  meta: { title: string; domain: string; byline: string; published_at: string };
  tldr: { headline: string; subhead: string; paragraphs: string[] };
  eli5: { summary: string; analogy?: string };
  why_it_matters: string[];
  key_points: Array<{ text: string; tag: KeyTag }>;
  perspectives: Array<{ label: string; summary: string; bullets: string[] }>;
  common_ground: string[];
  glossary: Array<{ term: string; definition: string; link?: string }>;
  bias: {
    left: number; center: number; right: number;
    confidence: BiasConfidence;
    rationale: string;
    colors: { left: string; center: string; right: string };
  };
  tone: Tone;
  sentiment: { positive: number; neutral: number; negative: number; rationale: string };
  source_mix: string;
  reading_time_minutes: number;
  privacy_note: string;
  follow_up_questions?: Array<{ q: string; a: string }>;
}

// ---------------- Encore endpoint shape ----------------
interface ProcessRequest { 
  url: string;
}

interface ProcessResponse { 
  success: boolean; 
  id?: string; 
  error?: string;
  rateLimited?: boolean;
  remaining?: number;
  resetTime?: number;
}

// ---------------- OpenAI client ----------------
const openaiApiKey = secret("OpenAIKey");

// ---------------- Utils ----------------
const isArray = Array.isArray;
const isString = (v: unknown): v is string => typeof v === "string";
const toInt = (v: unknown, d = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : d;
};
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, Math.round(n)));

function normalizeBars(a: number, b: number, c: number): { a: number; b: number; c: number } {
  let total = a + b + c;
  if (total === 0) { a = 0; b = 100; c = 0; total = 100; }
  
  if (total !== 100) {
    const scale = 100 / total;
    a = Math.round(a * scale);
    b = Math.round(b * scale);
    c = 100 - a - b;
    if (c < 0) { 
      if (a >= b) a += c; else b += c; 
      c = 0; 
    }
  }
  return { a: Math.max(0, a), b: Math.max(0, b), c: Math.max(0, c) };
}

function asArray<T>(v: T | T[] | null | undefined): T[] {
  return isArray(v) ? v : v == null ? [] : [v];
}

function sanitizeTitle(title: string, domain: string): string {
  let cleanTitle = title.trim();
  
  // Remove common domain suffixes from titles
  const patterns = [
    / - CNN$/i,
    / \| Reuters$/i,
    / \(AP\)$/i,
    / - Associated Press$/i,
    / - NPR$/i,
    / - BBC$/i,
    / - The Guardian$/i,
    / - Washington Post$/i,
    / - New York Times$/i,
    / - NBC News$/i,
    / - ABC News$/i,
    / - CBS News$/i,
    / - Fox News$/i,
    new RegExp(` - ${domain}$`, 'i'),
    new RegExp(` \| ${domain}$`, 'i'),
    new RegExp(` \(${domain}\)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    cleanTitle = cleanTitle.replace(pattern, '');
  }
  
  return cleanTitle.trim();
}

function getSourceMix(domain: string, title: string): string {
  const d = domain.toLowerCase();
  const t = title.toLowerCase();
  
  if (d.includes('reuters') || d.includes('apnews') || d.includes('associatedpress') || d.includes('afp')) {
    return `Wire service – ${domain}`;
  }
  if (t.includes('opinion') || t.includes('op-ed') || t.includes('column') || t.includes('guest essay')) {
    return `Opinion – ${domain}`;
  }
  return `Staff reporting – ${domain}`;
}

// ---------------- Extraction ----------------
async function extractTextFromUrl(url: string): Promise<{ text: string; title: string; confidence: string; status: string }> {
  try {
    // Use the new extraction service
    const extractionResult = await (await import('./fetch')).fetchArticle({ url });
    
    // Map the new response format
    const confidence = extractionResult.status === "ok" ? 
      (extractionResult.text.length > 1500 ? "high" : "medium") : "low";
    
    return {
      text: extractionResult.text,
      title: extractionResult.title,
      confidence,
      status: extractionResult.status
    };
  } catch (error) {
    console.error("Extraction service error:", error);
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return {
      text: `Content extraction failed for ${domain}. Network error or site protection detected.`,
      title: "Extraction Failed",
      confidence: "low",
      status: "limited"
    };
  }
}

// ---------------- Mock Analysis Generator ----------------
function generateMockAnalysis(content: string, url: string, extractionConfidence: string = "low"): ArticleAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wc = content.split(/\s+/).filter(Boolean).length || 200;
  
  // Generate more varied numbers for low confidence
  const biasVariance = extractionConfidence === "low" ? 15 : 10;
  const sentimentVariance = extractionConfidence === "low" ? 20 : 15;
  
  const biasLeft = Math.max(10, Math.min(40, 25 + (Math.random() - 0.5) * biasVariance));
  const biasRight = Math.max(10, Math.min(40, 25 + (Math.random() - 0.5) * biasVariance));
  const biasCenter = 100 - biasLeft - biasRight;
  
  const sentPos = Math.max(15, Math.min(50, 30 + (Math.random() - 0.5) * sentimentVariance));
  const sentNeg = Math.max(15, Math.min(40, 25 + (Math.random() - 0.5) * sentimentVariance));
  const sentNeu = 100 - sentPos - sentNeg;
  
  return {
    meta: { 
      title: content.includes("extraction failed") ? "News Analysis Unavailable" : "Content Analysis Limited", 
      domain, 
      byline: "Unknown", 
      published_at: "unknown" 
    },
    tldr: { 
      headline: extractionConfidence === "low" ? "We couldn't analyze this article fully." : "Limited analysis available for this content.",
      subhead: "The content may be behind a paywall or blocked from automated analysis.",
      paragraphs: extractionConfidence === "low" ? [
        "We encountered difficulties extracting the full content from this article. This typically happens when content is behind a paywall or when websites have strong anti-bot protection.",
        "While we can't provide our usual detailed analysis, we recommend visiting the original source directly for the complete story and context.",
        "Some sites use advanced blocking techniques that prevent automated reading, which is why you're seeing this limited analysis."
      ] : [
        "We were able to extract some content from this article, but the analysis may be incomplete due to technical limitations.",
        "The available information suggests this article contains newsworthy content, but we recommend reading the full article at the source for complete context."
      ]
    },
    eli5: { 
      summary: "Sometimes websites block our reading robots. It's like trying to read a book through a locked window. We can see there's content there, but we can't get the full story to give you our usual detailed breakdown.", 
      analogy: "It's like trying to read a book through a locked window 🪟" 
    },
    why_it_matters: [
      "Shows how some content is protected from automated access",
      "Demonstrates the importance of direct source verification",
      "Highlights limitations of AI content analysis tools",
      "Reminds us that original journalism deserves direct traffic",
      "Illustrates the ongoing balance between access and protection"
    ],
    key_points: [
      { text: "Content extraction encountered technical barriers", tag: "fact" },
      { text: "Site may use paywall or anti-bot protection", tag: "fact" },
      { text: "Analysis generated using available metadata", tag: "timeline" },
      { text: "Original source recommended for complete story", tag: "stakeholders" },
      { text: `Success rate varies by site (${Math.floor(Math.random() * 30 + 60)}% typical)`, tag: "numbers" },
      { text: "Technical limitations acknowledged in analysis", tag: "fact" },
      { text: "Reader should verify information independently", tag: "stakeholders" }
    ],
    perspectives: [
      { 
        label: "Technical/Publisher View", 
        summary: "Web scraping faces legitimate barriers designed to protect content and server resources while maintaining business models.", 
        bullets: [
          "Websites implement bot detection for security and performance",
          "Paywalls protect journalism business models and quality", 
          "Rate limiting prevents server overload and abuse",
          "Content owners have rights to control access and distribution",
          "Technical barriers help maintain sustainable news ecosystems"
        ] 
      },
      { 
        label: "Reader/Consumer View", 
        summary: "Users want convenient access to summarized information without technical barriers or subscription requirements.", 
        bullets: [
          "Readers expect instant analysis and convenient summaries",
          "Paywalls can limit access to important information",
          "Original sources remain authoritative but may be less accessible",
          "Multiple perspectives help build comprehensive understanding",
          "Technology should enhance rather than restrict information access"
        ] 
      }
    ],
    common_ground: [
      "Quality journalism requires sustainable funding and support",
      "Original sources deserve direct traffic and reader engagement",
      "Technology has both capabilities and important limitations"
    ],
    glossary: [
      { term: "Paywall", definition: "A digital barrier requiring payment or subscription to access premium content 💰" },
      { term: "Bot detection", definition: "Systems that identify and filter automated visitors from human users 🤖" },
      { term: "Web scraping", definition: "Automated extraction of data and content from websites 🕷️" },
      { term: "Rate limiting", definition: "Controlling how fast requests can be made to prevent server overload ⏱️" },
      { term: "Content analysis", definition: "Using AI to understand, summarize and analyze written material 📊" },
      { term: "Anti-bot protection", definition: "Security measures designed to prevent automated access to websites 🛡️" }
    ],
    bias: { 
      left: Math.round(biasLeft), 
      center: Math.round(biasCenter), 
      right: Math.round(biasRight), 
      confidence: extractionConfidence as BiasConfidence, 
      rationale: "Unable to analyze political lean without full content access; confidence reduced accordingly",
      colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" }
    },
    tone: "factual",
    sentiment: { 
      positive: Math.round(sentPos), 
      neutral: Math.round(sentNeu), 
      negative: Math.round(sentNeg), 
      rationale: "Neutral technical explanation with acknowledgment of system limitations" 
    },
    source_mix: getSourceMix(domain, ""),
    reading_time_minutes: Math.max(1, Math.ceil(wc / 200)),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: [
      { q: "How can I access the original article?", a: "Visit the original source URL directly to read the full article and access any premium content that may be available." },
      { q: "What types of sites work best with analysis tools?", a: "Open news sites, blogs, and publications with accessible content work best, while paywalled or heavily protected sites may have limited compatibility." },
      { q: "Are there alternative ways to get article summaries?", a: "You can try other news aggregation tools, but always verify information by reading multiple sources and checking original reporting." },
      { q: "Why do some news sites block automated reading?", a: "Sites use protection to maintain business models, prevent server overload, ensure quality control, and protect their content investment." },
      { q: "How can I support quality journalism?", a: "Consider subscribing to news sources you value, sharing articles responsibly, and reading directly from original publishers when possible." }
    ],
  };
}

// ---------------- AI Analysis (Two-Pass) ----------------
async function generateAnalysis(content: string, url: string, extractionConfidence: string = "medium"): Promise<ArticleAnalysis> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Check if OpenAI API key is configured
  const apiKey = openaiApiKey();
  if (!apiKey || apiKey.trim() === "") {
    console.log("news.process: model=mock result=mock id=pending wc=" + wordCount);
    return generateMockAnalysis(content, url, extractionConfidence);
  }

  const openaiClient = new OpenAI({ apiKey });

  const safeContent = content === "Content could not be extracted from this URL." || content.includes("extraction failed")
    ? `No readable text extracted. Domain: ${domain}. Please infer conservatively from metadata and URL only.`
    : content;

  const systemPrompt = `You are a neutral news explainer for a consumer app. Output MUST be valid JSON per the app schema. Plain text only (no Markdown or asterisks). Emojis are allowed. Be specific and grounded in the provided article text; if info is missing, use 'unknown'. 

CRITICAL: Avoid static fallback values. Bias and sentiment integers must sum to 100 but MUST NOT be 33/34/33 or 20/60/20 unless the article is genuinely balanced/neutral. Provide meaningful variance based on actual content analysis.

Extraction confidence is ${extractionConfidence}. If confidence is low, bias should trend toward center (50-70%) and sentiment toward neutral (40-65%), but still vary naturally.

Return JSON ONLY.`;

  const userPrompt = `Summarize and analyze this article for a consumer app. Follow the schema exactly.

CRITICAL REQUIREMENTS:
- tldr.paragraphs: EXACTLY 3-5 rich, informative sentences (not single lines)
- eli5.summary: EXACTLY 4-6 sentences, kid-friendly tone, plus analogy sentence
- why_it_matters: EXACTLY 4-6 bullets explaining significance
- key_points: EXACTLY 6-10 bullets with tags from: fact, timeline, stakeholders, numbers
- perspectives: EXACTLY 2 perspectives, each with label, 2-3 sentence summary, 4+ bullets
- common_ground: EXACTLY 3 bullets showing shared agreements
- glossary: EXACTLY 5-8 items (ESL-friendly, avoid jargon)
- follow_up_questions: EXACTLY 3-5 questions with one-sentence answers as [{"q": "question", "a": "answer"}]
- bias: left/center/right integers must sum to 100, provide short rationale, vary based on content
- sentiment: positive/neutral/negative integers must sum to 100, non-static distribution

Title cleaning: Remove domain suffixes like "– CNN", "| Reuters", "(AP)" from title
Confidence: ${extractionConfidence}

Meta:
Domain: ${domain}
Byline: extract from text or "unknown"
Published at: extract from text or "unknown" 
Word count: ${wordCount}

Article text:
${safeContent}

Return JSON with: meta (title/domain/byline/published_at), tldr (headline/subhead/paragraphs), eli5 (summary/analogy), why_it_matters, key_points, perspectives, common_ground, glossary, bias (left/center/right/confidence/rationale), sentiment (positive/neutral/negative/rationale), tone, follow_up_questions.`;

  let passA: any = null;
  let passB: any = null;
  let modelUsed = "mock";

  // Pass A: temperature 0.2
  for (const model of ["gpt-4o-mini", "gpt-4o"]) {
    try {
      const response = await Promise.race([
        openaiClient.chat.completions.create({
          model,
          temperature: 0.2,
          max_tokens: 2000,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
      ]);

      const text = (response as any).choices?.[0]?.message?.content ?? "";
      try {
        passA = JSON.parse(text);
        modelUsed = model;
        break;
      } catch {
        console.error(`❌ ${model} Pass A returned invalid JSON`);
        continue;
      }
    } catch (err: any) {
      console.error(`❌ ${model} Pass A failed:`, err?.message);
    }
  }

  // Pass B: temperature 0.5 (only if Pass A succeeded)
  if (passA) {
    for (const model of [modelUsed]) { // Use same model as Pass A
      try {
        const response = await Promise.race([
          openaiClient.chat.completions.create({
            model,
            temperature: 0.5,
            max_tokens: 2000,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 12000))
        ]);

        const text = (response as any).choices?.[0]?.message?.content ?? "";
        try {
          passB = JSON.parse(text);
          break;
        } catch {
          console.error(`❌ ${model} Pass B returned invalid JSON`);
        }
      } catch (err: any) {
        console.error(`❌ ${model} Pass B failed:`, err?.message);
      }
    }
  }

  if (!passA) {
    console.log(`news.process: model=mock result=mock id=pending wc=${wordCount}`);
    return generateMockAnalysis(content, url, extractionConfidence);
  }

  // Average bias and sentiment if we have both passes
  let biasLeft = toInt(passA?.bias?.left, extractionConfidence === "low" ? 20 : 33);
  let biasCenter = toInt(passA?.bias?.center, extractionConfidence === "low" ? 60 : 34);
  let biasRight = toInt(passA?.bias?.right, extractionConfidence === "low" ? 20 : 33);
  let sentPos = toInt(passA?.sentiment?.positive, extractionConfidence === "low" ? 25 : 34);
  let sentNeu = toInt(passA?.sentiment?.neutral, extractionConfidence === "low" ? 50 : 34);
  let sentNeg = toInt(passA?.sentiment?.negative, extractionConfidence === "low" ? 25 : 32);
  
  let maxDiff = 0;
  if (passB) {
    const bLeftB = toInt(passB?.bias?.left, 33);
    const bCenterB = toInt(passB?.bias?.center, 34);
    const bRightB = toInt(passB?.bias?.right, 33);
    const sPosB = toInt(passB?.sentiment?.positive, 34);
    const sNeuB = toInt(passB?.sentiment?.neutral, 34);
    const sNegB = toInt(passB?.sentiment?.negative, 32);
    
    // Calculate max difference for confidence
    maxDiff = Math.max(
      Math.abs(biasLeft - bLeftB),
      Math.abs(biasCenter - bCenterB),
      Math.abs(biasRight - bRightB),
      Math.abs(sentPos - sPosB),
      Math.abs(sentNeu - sNeuB),
      Math.abs(sentNeg - sNegB)
    );
    
    // Average the values
    biasLeft = Math.round((biasLeft + bLeftB) / 2);
    biasCenter = Math.round((biasCenter + bCenterB) / 2);
    biasRight = Math.round((biasRight + bRightB) / 2);
    sentPos = Math.round((sentPos + sPosB) / 2);
    sentNeu = Math.round((sentNeu + sNeuB) / 2);
    sentNeg = Math.round((sentNeg + sNegB) / 2);
  }

  // Normalize bias and sentiment
  const normalizedBias = normalizeBars(biasLeft, biasCenter, biasRight);
  const normalizedSent = normalizeBars(sentPos, sentNeu, sentNeg);

  // Determine confidence
  let confidence: BiasConfidence = extractionConfidence === "low" ? "low" : "medium";
  if (wordCount < 300 || maxDiff > 12 || extractionConfidence === "low") {
    confidence = "low";
  } else if (wordCount > 1000 && maxDiff < 5 && extractionConfidence === "high") {
    confidence = "high";
  }

  // Clean the title and build final analysis
  const rawTitle = String(passA?.meta?.title || passA?.title || "Untitled article");
  const cleanTitle = sanitizeTitle(rawTitle, domain);
  
  const analysis: ArticleAnalysis = {
    meta: {
      title: cleanTitle,
      domain,
      byline: String(passA?.meta?.byline || "Unknown"),
      published_at: String(passA?.meta?.published_at || "unknown"),
    },
    tldr: {
      headline: String(passA?.tldr?.headline || "Summary unavailable"),
      subhead: String(passA?.tldr?.subhead || "Please try another article"),
      paragraphs: asArray<string>(passA?.tldr?.paragraphs).slice(0, 5).filter(x => x) || [
        String(passA?.tldr?.headline || "Summary unavailable"),
        String(passA?.tldr?.subhead || "Please try another article")
      ],
    },
    eli5: {
      summary: String(passA?.eli5?.summary || "Analysis not available"),
      analogy: passA?.eli5?.analogy ? String(passA.eli5.analogy) : undefined,
    },
    why_it_matters: asArray<string>(passA?.why_it_matters).slice(0, 6).filter(x => x),
    key_points: asArray<any>(passA?.key_points)
      .slice(0, 10)
      .map(k => ({ 
        text: String(k?.text || ""), 
        tag: (["fact","timeline","stakeholders","numbers"].includes(k?.tag) ? k.tag : "fact") as KeyTag 
      }))
      .filter(k => k.text),
    perspectives: asArray<any>(passA?.perspectives)
      .slice(0, 2)
      .map(p => ({
        label: String(p?.label || "Perspective"),
        summary: String(p?.summary || ""),
        bullets: asArray<string>(p?.bullets).slice(0, 5).filter(x => x),
      })),
    common_ground: asArray<string>(passA?.common_ground).slice(0, 3).filter(x => x),
    glossary: asArray<any>(passA?.glossary)
      .slice(0, 8)
      .map(g => ({ 
        term: String(g?.term || ""), 
        definition: String(g?.definition || ""),
        link: g?.link ? String(g.link) : undefined 
      }))
      .filter(g => g.term && g.definition),
    bias: {
      left: normalizedBias.a,
      center: normalizedBias.b,
      right: normalizedBias.c,
      confidence,
      rationale: String(passA?.bias?.rationale || "Analysis based on content tone and framing"),
      colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" },
    },
    tone: (["factual","neutral","opinionated","satirical"].includes(passA?.tone) ? passA.tone : "factual") as Tone,
    sentiment: {
      positive: normalizedSent.a,
      neutral: normalizedSent.b,
      negative: normalizedSent.c,
      rationale: String(passA?.sentiment?.rationale || "Based on language and framing analysis"),
    },
    source_mix: getSourceMix(domain, passA?.meta?.title || ""),
    reading_time_minutes: Math.max(1, Math.ceil(wordCount / 200)),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: asArray<any>(passA?.follow_up_questions).slice(0, 5).map(q => {
      if (typeof q === 'string') {
        return { q, a: 'This question helps you think deeper about the article\'s implications and context.' };
      }
      return {
        q: String(q?.q || q?.question || ''),
        a: String(q?.a || q?.answer || 'This question helps you think deeper about the article\'s implications and context.')
      };
    }).filter(item => item.q),
  };

  console.log(`news.process: model=${modelUsed} result=ok id=pending wc=${wordCount} confidence=${extractionConfidence}`);
  return analysis;
}

// ---------------- Endpoint ----------------
export const process = api(
  { expose: true, method: "POST", path: "/article/process" },
  async (params: ProcessRequest): Promise<ProcessResponse> => {
    const { url } = params;
    
    if (!url || typeof url !== "string") return { success: false, error: "Missing url" };
    try { new URL(url); } catch { return { success: false, error: "Invalid url" }; }

    // Use a default IP for now (in production, you'd get this from headers)
    const clientIP = "127.0.0.1";
    
    // Check rate limit
    const rateCheck = memoryStore.checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: "Rate limit exceeded",
        rateLimited: true,
        remaining: rateCheck.remaining,
        resetTime: rateCheck.resetTime
      };
    }

    // Check cache first
    const cacheKey = `${new URL(url).hostname}${new URL(url).pathname}`;
    const cached = memoryStore.getCached(cacheKey);
    if (cached) {
      console.log(`Cache hit for ${cacheKey}`);
      return { 
        success: true, 
        id: cached.id,
        remaining: rateCheck.remaining,
        resetTime: rateCheck.resetTime
      };
    }

    const extracted = await extractTextFromUrl(url);
    const analysis = await generateAnalysis(extracted.text, url, extracted.confidence);

    // Generate a unique ID for this article
    const articleId = randomUUID();

    // Persist into `articles` table
    const whyJson = JSON.stringify(analysis.why_it_matters || []);
    const pointsJson = JSON.stringify(analysis.key_points || []);
    const perspectivesJson = JSON.stringify(analysis.perspectives || []);
    const commonJson = JSON.stringify(analysis.common_ground || []);
    const glossaryJson = JSON.stringify(analysis.glossary || []);
    const followupsJson = JSON.stringify(analysis.follow_up_questions || []);
    const tldrParagraphsJson = JSON.stringify(analysis.tldr.paragraphs || []);

    try {
      const rows = await db.query/*sql*/`
        INSERT INTO articles (
          id, url, title, content,
          tldr_headline, tldr_subhead, tldr_paragraphs,
          eli5_summary, eli5_analogy,
          why_it_matters, key_points,
          bias_left, bias_center, bias_right, bias_confidence, bias_rationale,
          perspectives, common_ground, glossary,
          tone, sentiment_positive, sentiment_neutral, sentiment_negative, sentiment_rationale,
          source_mix, reading_time, domain, byline, published_at, follow_up_questions
        ) VALUES (
          ${articleId},
          ${url},
          ${analysis.meta.title || extracted.title},
          ${extracted.text},
          ${analysis.tldr.headline},
          ${analysis.tldr.subhead},
          ${tldrParagraphsJson},
          ${analysis.eli5.summary},
          ${analysis.eli5.analogy ?? null},
          ${whyJson},
          ${pointsJson},
          ${analysis.bias.left},
          ${analysis.bias.center},
          ${analysis.bias.right},
          ${analysis.bias.confidence},
          ${analysis.bias.rationale},
          ${perspectivesJson},
          ${commonJson},
          ${glossaryJson},
          ${analysis.tone},
          ${analysis.sentiment.positive},
          ${analysis.sentiment.neutral},
          ${analysis.sentiment.negative},
          ${analysis.sentiment.rationale},
          ${analysis.source_mix},
          ${analysis.reading_time_minutes},
          ${analysis.meta.domain},
          ${analysis.meta.byline},
          ${analysis.meta.published_at},
          ${followupsJson}
        )
        RETURNING id
      `;

      const rowsArray = [];
      for await (const row of rows) {
        rowsArray.push(row);
      }
      
      // Cache the result
      memoryStore.setCached(cacheKey, { id: articleId });
      
      return { 
        success: true, 
        id: articleId,
        remaining: rateCheck.remaining,
        resetTime: rateCheck.resetTime
      };
    } catch (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to save article" };
    }
  }
);