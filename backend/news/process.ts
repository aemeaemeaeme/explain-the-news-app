import { api } from "encore.dev/api";
import db from "../db";
import OpenAI from "openai";

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
  tldr: { headline: string; subhead: string };
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
    colors?: { left: string; center: string; right: string };
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

// ---------------- Minimal utils ----------------
const isArray = Array.isArray;
const isString = (v: unknown): v is string => typeof v === "string";
const toInt = (v: unknown, d = 0) => {
  const n = Math.round(Number(v));
  return Number.isFinite(n) ? n : d;
};
const clamp01 = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

function normalizeBias(leftIn: unknown, centerIn: unknown, rightIn: unknown) {
  let L = clamp01(toInt(leftIn, 33));
  let C = clamp01(toInt(centerIn, 34));
  let R = clamp01(toInt(rightIn, 33));
  let sum = L + C + R;

  if (sum === 0) { L = 0; C = 100; R = 0; sum = 100; }

  if (sum !== 100) {
    const scale = 100 / sum;
    L = Math.round(L * scale);
    C = Math.round(C * scale);
    R = 100 - L - C;
    if (R < 0) { if (L >= C) L += R; else C += R; R = 0; }
  }
  return { left: L, center: C, right: R };
}

function asArray<T>(v: T | T[] | null | undefined): T[] {
  return isArray(v) ? v : v == null ? [] : [v];
}

// ---------------- Simple extraction (best-effort) ----------------
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

// ---------------- OpenAI client ----------------
const openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY as string });

// very light sanitizer to guarantee required keys exist
function sanitizeAnalysis(raw: any, url: string, content: string): ArticleAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wc = content.split(/\s+/).filter(Boolean).length;
  const biasNorm = normalizeBias(raw?.bias?.left, raw?.bias?.center, raw?.bias?.right);

  const out: ArticleAnalysis = {
    meta: {
      title: String(raw?.meta?.title || ""),
      domain: String(raw?.meta?.domain || domain),
      byline: String(raw?.meta?.byline || "Unknown"),
      published_at: String(raw?.meta?.published_at || "unknown"),
    },
    tldr: {
      headline: String(raw?.tldr?.headline || ""),
      subhead: String(raw?.tldr?.subhead || ""),
    },
    eli5: {
      summary: String(raw?.eli5?.summary || ""),
      analogy: raw?.eli5?.analogy ? String(raw.eli5.analogy) : undefined,
    },
    why_it_matters: asArray<string>(raw?.why_it_matters),
    key_points: asArray<any>(raw?.key_points)
      .map(k => ({ text: String(k?.text || ""), tag: (k?.tag as KeyTag) || "fact" }))
      .filter(k => k.text),
    perspectives: asArray<any>(raw?.perspectives)
      .slice(0, 2)
      .map(p => ({
        label: String(p?.label || "Perspective"),
        summary: String(p?.summary || ""),
        bullets: asArray<string>(p?.bullets).slice(0, 4),
      })),
    common_ground: asArray<string>(raw?.common_ground).slice(0, 3),
    glossary: asArray<any>(raw?.glossary)
      .map(g => ({ term: String(g?.term || ""), definition: String(g?.definition || ""), link: g?.link ? String(g.link) : undefined }))
      .filter(g => g.term && g.definition)
      .slice(0, 6),
    bias: {
      left: biasNorm.left,
      center: biasNorm.center,
      right: biasNorm.right,
      confidence: (["low","medium","high"] as BiasConfidence[]).includes(raw?.bias?.confidence) ? raw.bias.confidence : "medium",
      rationale: String(raw?.bias?.rationale || ""),
      colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" },
    },
    tone: (["factual","neutral","opinionated","satirical"] as Tone[]).includes(raw?.tone) ? raw.tone : "factual",
    sentiment: {
      positive: clamp01(toInt(raw?.sentiment?.positive, 34)),
      neutral: clamp01(toInt(raw?.sentiment?.neutral, 34)),
      negative: clamp01(toInt(raw?.sentiment?.negative, 32)),
      rationale: String(raw?.sentiment?.rationale || ""),
    },
    source_mix: String(raw?.source_mix || ""),
    reading_time_minutes: Math.max(1, toInt(raw?.reading_time_minutes, Math.ceil(wc / 200))),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: asArray<string>(raw?.follow_up_questions).slice(0, 3),
  };

  return out;
}

// tiny fallback in case all models fail hard
function generateMockAnalysis(content: string, url: string): ArticleAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wc = content.split(/\s+/).filter(Boolean).length || 200;
  return {
    meta: { title: "Untitled article", domain, byline: "Unknown", published_at: "unknown" },
    tldr: { headline: "Quick summary unavailable", subhead: "We couldn’t generate a full analysis." },
    eli5: { summary: "We couldn’t read this page properly. Try another link." },
    why_it_matters: ["Readers get a fallback instead of an error."],
    key_points: [{ text: "Analysis failed; fallback used.", tag: "fact" }],
    perspectives: [
      { label: "General view", summary: "Not enough data.", bullets: ["Try a different URL", "Or paste full text"] },
      { label: "Alternate view", summary: "Extraction failed.", bullets: ["Paywall/JS blocked", "Site denied fetch"] }
    ],
    common_ground: ["The link may block bots", "Text extraction failed"],
    glossary: [{ term: "Extraction", definition: "Turning a web page into clean text." }],
    bias: { left: 33, center: 34, right: 33, confidence: "low", rationale: "No content to score", colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" } },
    tone: "factual",
    sentiment: { positive: 0, neutral: 100, negative: 0, rationale: "No sentiment without content" },
    source_mix: "unknown",
    reading_time_minutes: Math.max(1, Math.ceil(wc / 200)),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: ["What is the main claim?", "Who is affected?", "What’s the timeline?"],
  };
}

// ---------- OpenAI-powered analysis (fixed to use OpenAI SDK) ----------
async function generateAnalysis(content: string, url: string): Promise<ArticleAnalysis> {
  const domain = new URL(url).hostname;
  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const safeContent =
    content && content !== "Content could not be extracted from this URL."
      ? content
      : `No readable text extracted. Domain: ${domain}. Please infer conservatively from metadata and URL only.`;

  const systemPrompt = `You are a neutral news explainer. Output MUST be valid JSON per the app schema.
Rules:
- Plain text only. NO Markdown, asterisks, emojis, or bullet symbols inside strings.
- Be specific and grounded in the provided article text. If information is missing, write "unknown".
- Respect lengths. Do not add extra keys.
- Bias and sentiment must be integers that sum to 100 each.
- Exactly two perspectives; 3–6 glossary items; 3–5 why-it-matters; 5–8 key_points.
Return JSON ONLY.`;

  const userPrompt = `Summarize and analyze this article for a consumer app. Follow the schema exactly.

Meta:
Domain: ${domain}
Byline: unknown
Published at: unknown
Approx. word_count: ${wordCount}

Article text (verbatim or best-effort):
${safeContent}

Return JSON only.`;

  // Use a conservative list—adjust to models enabled on your account
  const models = ["gpt-4o-mini", "gpt-4o"];

  for (const m of models) {
    try {
      const comp = await openaiClient.chat.completions.create({
        model: m,
        temperature: 0.2,
        max_tokens: 4000,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      });

      const text = comp.choices?.[0]?.message?.content ?? "";
      console.log(`🧠 Raw AI (${m}) response:`, text.slice(0, 500));

      let raw: any;
      try {
        raw = JSON.parse(text || "{}");
      } catch {
        console.error(`❌ ${m} returned invalid JSON. Skipping.`);
        continue;
      }

      const cleaned = sanitizeAnalysis(raw, url, content);

      console.log(`✅ AI analysis via ${m}:`, {
        title: cleaned.meta.title,
        keyPoints: cleaned.key_points.length,
        perspectives: cleaned.perspectives.length,
      });

      return cleaned;
    } catch (err: any) {
      console.error(`❌ OpenAI ${m} failed:`, err?.message || err);
    }
  }

  console.error("⚠️ All AI models failed. Using mock fallback.");
  return generateMockAnalysis(content, url);
}

// ---------------- Endpoint ----------------
export const process = api<ProcessRequest, ProcessResponse>(
  { expose: true, method: "POST", path: "/article/process" },
  async ({ url }) => {
    if (!url || typeof url !== "string") return { success: false, error: "Missing url" };
    try { new URL(url); } catch { return { success: false, error: "Invalid url" }; }

    const extracted = await extractTextFromUrl(url);
    const analysis = await generateAnalysis(extracted.text, url);

    // Persist into `articles` (columns your get.ts expects)
    const whyJson = JSON.stringify(analysis.why_it_matters || []);
    const pointsJson = JSON.stringify(analysis.key_points || []);
    const perspectivesJson = JSON.stringify(analysis.perspectives || []);
    const commonJson = JSON.stringify(analysis.common_ground || []);
    const glossaryJson = JSON.stringify(analysis.glossary || []);
    const followupsJson = JSON.stringify(analysis.follow_up_questions || []);

    const rows = await db.query/*sql*/`
      INSERT INTO articles (
        url, title, content,
        tldr_headline, tldr_subhead,
        eli5_summary, eli5_analogy,
        why_it_matters, key_points,
        bias_left, bias_center, bias_right, bias_confidence, bias_rationale,
        perspectives, common_ground, glossary,
        tone, sentiment_positive, sentiment_neutral, sentiment_negative, sentiment_rationale,
        source_mix, reading_time, domain, byline, published_at, follow_up_questions
      ) VALUES (
        ${url},
        ${analysis.meta.title || extracted.title},
        ${extracted.text},
        ${analysis.tldr.headline},
        ${analysis.tldr.subhead},
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

    const id = rows?.[0]?.id as string | undefined;
    if (!id) return { success: false, error: "Failed to save article" };

    return { success: true, id };
  }
);
