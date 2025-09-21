import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import OpenAI from "openai";
import { randomUUID } from "crypto";

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
  follow_up_questions?: string[];
}

// ---------------- Encore endpoint shape ----------------
interface ProcessRequest { url: string }
interface ProcessResponse { success: boolean; id?: string; error?: string }

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
async function extractTextFromUrl(url: string): Promise<{ text: string; title: string }> {
  try {
    const res = await fetch(url, {
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (ExplainTheNews/1.0)" },
    });
    if (!res.ok) throw new Error(`fetch failed: ${res.status}`);
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch?.[1]?.trim() || "Untitled article";

    const text = html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!text || text.split(" ").length < 60) {
      return { text: "Content could not be extracted from this URL.", title };
    }
    return { text, title };
  } catch {
    return { text: "Content could not be extracted from this URL.", title: "Untitled article" };
  }
}

// ---------------- Mock Analysis Generator ----------------
function generateMockAnalysis(content: string, url: string): ArticleAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wc = content.split(/\s+/).filter(Boolean).length || 200;
  
  return {
    meta: { 
      title: "News Analysis Unavailable", 
      domain, 
      byline: "Unknown", 
      published_at: "unknown" 
    },
    tldr: { 
      headline: "We couldn't analyze this article fully.", 
      subhead: "The content may be behind a paywall or blocked from automated analysis.",
      paragraphs: [
        "We encountered difficulties extracting the full content from this article. This typically happens when content is behind a paywall or when websites have strong anti-bot protection.",
        "While we can't provide our usual detailed analysis, we recommend visiting the original source directly for the complete story and context."
      ]
    },
    eli5: { 
      summary: "Sometimes websites block our reading robots. It's like trying to read a book through a locked window. We can see there's content there, but we can't get the full story.", 
      analogy: "It's like trying to read a book through a locked window 🪟" 
    },
    why_it_matters: [
      "Shows how some content is protected from automated access",
      "Demonstrates the need for direct source reading",
      "Highlights limitations of AI content analysis",
      "Reminds us to verify information from original sources"
    ],
    key_points: [
      { text: "Content extraction failed", tag: "fact" },
      { text: "Possible paywall or anti-bot protection", tag: "fact" },
      { text: "Analysis using fallback data", tag: "timeline" },
      { text: "User should visit original source", tag: "stakeholders" },
      { text: "Success rate varies by site", tag: "numbers" },
      { text: "Technical limitations acknowledged", tag: "fact" }
    ],
    perspectives: [
      { 
        label: "Technical View", 
        summary: "Web scraping faces legitimate barriers designed to protect content and server resources.", 
        bullets: [
          "Websites implement bot detection for security",
          "Paywalls protect journalism business models", 
          "Rate limiting prevents server overload",
          "Content owners have rights to control access"
        ] 
      },
      { 
        label: "User View", 
        summary: "Readers want convenient access to summarized information without technical barriers.", 
        bullets: [
          "Users expect instant analysis and summaries",
          "Manual article reading takes more time",
          "Original sources remain the authoritative truth",
          "Multiple perspectives enhance understanding"
        ] 
      }
    ],
    common_ground: [
      "Original journalism sources deserve direct traffic and support",
      "Technology has both capabilities and limitations"
    ],
    glossary: [
      { term: "Paywall", definition: "A digital barrier requiring payment to access content 💰" },
      { term: "Bot detection", definition: "Systems that identify automated visitors vs humans 🤖" },
      { term: "Web scraping", definition: "Automated extraction of data from websites 🕷️" },
      { term: "Rate limiting", definition: "Controlling how fast requests can be made to prevent overload ⏱️" },
      { term: "Content analysis", definition: "Using AI to understand and summarize written material 📊" }
    ],
    bias: { 
      left: 15, center: 70, right: 15, 
      confidence: "low", 
      rationale: "Unable to analyze political lean without full content access",
      colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" }
    },
    tone: "factual",
    sentiment: { 
      positive: 20, neutral: 60, negative: 20, 
      rationale: "Neutral technical explanation with acknowledgment of limitations" 
    },
    source_mix: getSourceMix(domain, ""),
    reading_time_minutes: Math.max(1, Math.ceil(wc / 200)),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: [
      "How can I access the original article?",
      "What types of sites work best with this tool?",
      "Are there alternative ways to get article summaries?"
    ],
  };
}

// ---------------- AI Analysis (Two-Pass) ----------------
async function generateAnalysis(content: string, url: string): Promise<ArticleAnalysis> {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  // Check if OpenAI API key is configured
  const apiKey = openaiApiKey();
  if (!apiKey || apiKey.trim() === "") {
    console.log("news.process: model=mock result=mock id=pending wc=" + wordCount);
    return generateMockAnalysis(content, url);
  }

  const openaiClient = new OpenAI({ apiKey });

  const safeContent = content === "Content could not be extracted from this URL." 
    ? `No readable text extracted. Domain: ${domain}. Please infer conservatively from metadata and URL only.`
    : content;

  const systemPrompt = `You are a neutral news explainer for a consumer app. Output MUST be valid JSON per the app schema. Plain text only (no Markdown or asterisks). Emojis are allowed. Be specific and grounded in the provided article text; if info is missing, use 'unknown'. Respect all length requirements exactly. Exactly two perspectives. Bias and sentiment integers must each sum to 100 and NOT be evenly split unless truly balanced. Return JSON ONLY.`;

  const userPrompt = `Summarize and analyze this article for a consumer app. Follow the schema exactly.

CRITICAL REQUIREMENTS:
- tldr.paragraphs: EXACTLY 2-3 short paragraphs (2-4 sentences each)
- eli5.summary: EXACTLY 3-6 sentences, kid-friendly tone, include optional analogy
- why_it_matters: EXACTLY 4-6 bullets  
- key_points: EXACTLY 5-8 bullets with tags from: fact, timeline, stakeholders, numbers
- perspectives: EXACTLY 2 labeled blocks, each with 1-2 sentence summary + 3-5 bullets
- common_ground: EXACTLY 3-5 bullets showing shared agreements
- glossary: EXACTLY 4-8 clear, Gen-Z/ESL-friendly items
- follow_up_questions: EXACTLY 3-6 specific, curiosity-driven questions
- bias/sentiment: integers summing to 100, avoid 33/34/33 splits unless truly balanced

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
    return generateMockAnalysis(content, url);
  }

  // Average bias and sentiment if we have both passes
  let biasLeft = toInt(passA?.bias?.left, 33);
  let biasCenter = toInt(passA?.bias?.center, 34);
  let biasRight = toInt(passA?.bias?.right, 33);
  let sentPos = toInt(passA?.sentiment?.positive, 34);
  let sentNeu = toInt(passA?.sentiment?.neutral, 34);
  let sentNeg = toInt(passA?.sentiment?.negative, 32);
  
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
  let confidence: BiasConfidence = "medium";
  if (wordCount < 300 || maxDiff > 12) {
    confidence = "low";
  } else if (wordCount > 1000 && maxDiff < 5) {
    confidence = "high";
  }

  // Sanitize and build final analysis
  const analysis: ArticleAnalysis = {
    meta: {
      title: String(passA?.meta?.title || passA?.title || "Untitled article"),
      domain,
      byline: String(passA?.meta?.byline || "Unknown"),
      published_at: String(passA?.meta?.published_at || "unknown"),
    },
    tldr: {
      headline: String(passA?.tldr?.headline || "Summary unavailable"),
      subhead: String(passA?.tldr?.subhead || "Please try another article"),
      paragraphs: asArray<string>(passA?.tldr?.paragraphs).slice(0, 3).filter(x => x) || [
        String(passA?.tldr?.headline || "Summary unavailable"),
        String(passA?.tldr?.subhead || "Please try another article")
      ],
    },
    eli5: {
      summary: String(passA?.eli5?.summary || "Analysis not available"),
      analogy: passA?.eli5?.analogy ? String(passA.eli5.analogy) : undefined,
    },
    why_it_matters: asArray<string>(passA?.why_it_matters).slice(0, 5).filter(x => x),
    key_points: asArray<any>(passA?.key_points)
      .slice(0, 8)
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
        bullets: asArray<string>(p?.bullets).slice(0, 4).filter(x => x),
      })),
    common_ground: asArray<string>(passA?.common_ground).slice(0, 3).filter(x => x),
    glossary: asArray<any>(passA?.glossary)
      .slice(0, 6)
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
    follow_up_questions: asArray<string>(passA?.follow_up_questions).slice(0, 3).filter(x => x),
  };

  console.log(`news.process: model=${modelUsed} result=ok id=pending wc=${wordCount}`);
  return analysis;
}

// ---------------- Endpoint ----------------
export const process = api<ProcessRequest, ProcessResponse>(
  { expose: true, method: "POST", path: "/article/process" },
  async ({ url }) => {
    if (!url || typeof url !== "string") return { success: false, error: "Missing url" };
    try { new URL(url); } catch { return { success: false, error: "Invalid url" }; }

    const extracted = await extractTextFromUrl(url);
    const analysis = await generateAnalysis(extracted.text, url);

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
      
      return { success: true, id: articleId };
    } catch (error) {
      console.error("Database error:", error);
      return { success: false, error: "Failed to save article" };
    }
  }
);