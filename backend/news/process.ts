import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import db from "../db";
import { randomUUID } from "crypto";
import { memoryStore } from "./store";

/** ========= Gemini dynamic import ========= */
let GoogleGenerativeAI: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const geminiModule = require("@google/generative-ai");
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (err) {
  console.warn("Google Generative AI package not available:", err);
}
const geminiApiKey = secret("GEMINI_API_KEY");

/** ========= Types to match get.ts / UI ========= */
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

/** ========= Endpoint shapes ========= */
interface ProcessRequest { url: string; }
interface ProcessResponse {
  success: boolean; id?: string; error?: string;
  rateLimited?: boolean; remaining?: number; resetTime?: number;
}

/** ========= Small utils ========= */
const isArray = Array.isArray;
const asArray = <T,>(v: T | T[] | null | undefined): T[] => (isArray(v) ? v as T[] : v == null ? [] : [v as T]);
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Math.round(n)));
const toInt = (v: unknown, d = 0) => { const n = Math.round(Number(v)); return Number.isFinite(n) ? n : d; };

function normalizeBars(a: number, b: number, c: number) {
  let A = clamp(a, 0, 100), B = clamp(b, 0, 100), C = clamp(c, 0, 100);
  let sum = A + B + C;
  if (sum <= 0) { A = 0; B = 100; C = 0; sum = 100; }
  if (sum !== 100) {
    const s = 100 / sum;
    A = Math.round(A * s); B = Math.round(B * s); C = 100 - A - B;
    if (C < 0) { if (A >= B) A += C; else B += C; C = 0; }
  }
  return { A, B, C };
}

function sanitizeTitle(title: string, domain: string) {
  let t = (title || "").trim();
  const patterns = [
    / - CNN$/i, / \| Reuters$/i, / \(AP\)$/i, / - Associated Press$/i, / - NPR$/i,
    / - BBC$/i, / - The Guardian$/i, / - Washington Post$/i, / - New York Times$/i,
    / - NBC News$/i, / - ABC News$/i, / - CBS News$/i, / - Fox News$/i,
    new RegExp(` - ${domain}$`, "i"), new RegExp(` \\| ${domain}$`, "i"), new RegExp(` \\(${domain}\\)$`, "i"),
  ];
  for (const rx of patterns) t = t.replace(rx, "");
  return t.trim();
}

function getSourceMix(domain: string, title: string) {
  const d = domain.toLowerCase(), t = title.toLowerCase();
  if (d.includes("reuters") || d.includes("apnews") || d.includes("associatedpress") || d.includes("afp")) return `Wire service – ${domain}`;
  if (t.includes("opinion") || t.includes("op-ed") || t.includes("column") || t.includes("guest essay")) return `Opinion – ${domain}`;
  return `Staff reporting – ${domain}`;
}

/** ========= Robust JSON helpers ========= */
function stripFences(s: string) {
  let x = (s || "").trim();
  if (x.startsWith("```json")) x = x.replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
  else if (x.startsWith("```")) x = x.replace(/^```\s*/i, "").replace(/\s*```$/i, "");
  return x.trim();
}
function parseFirstJson(s: string): any {
  const txt = stripFences(s);
  try { return JSON.parse(txt); } catch {}
  const i = txt.indexOf("{"), j = txt.lastIndexOf("}");
  if (i >= 0 && j > i) {
    const cand = txt.slice(i, j + 1);
    try { return JSON.parse(cand); } catch {}
  }
  throw new Error("non_json");
}

/** ========= Extraction ========= */
async function extractTextFromUrl(url: string): Promise<{ text: string; title: string; status: "ok"|"limited"; confidence: "low"|"medium"|"high" }> {
  try {
    // Call your fetch API (same-process call works in Encore/Leap)
    const { fetchArticle } = await import("./fetch");
    const r = await fetchArticle({ url });
    const conf = r.status === "ok" ? (r.text.length > 1500 ? "high" : "medium") : "low";
    return { text: r.text, title: r.title, status: r.status, confidence: conf };
  } catch (e) {
    console.error("Extraction service error:", e);
    const domain = new URL(url).hostname.replace(/^www\./, "");
    return {
      text: `Content extraction failed for ${domain}. Network error or site protection detected.`,
      title: "Extraction Failed",
      status: "limited",
      confidence: "low",
    };
  }
}

/** ========= Mock analysis when Gemini missing/fails ========= */
function mockAnalysis(content: string, url: string, conf: "low"|"medium"|"high"): ArticleAnalysis {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const wc = content.split(/\s+/).filter(Boolean).length || 200;
  const biasLeft = clamp(25 + (Math.random() - 0.5) * (conf === "low" ? 15 : 10), 10, 40);
  const biasRight = clamp(25 + (Math.random() - 0.5) * (conf === "low" ? 15 : 10), 10, 40);
  const biasCenter = 100 - biasLeft - biasRight;
  const pos = clamp(30 + (Math.random() - 0.5) * (conf === "low" ? 20 : 15), 15, 50);
  const neg = clamp(25 + (Math.random() - 0.5) * (conf === "low" ? 20 : 15), 15, 40);
  const neu = 100 - pos - neg;

  return {
    meta: { title: "Content Analysis Limited", domain, byline: "Unknown", published_at: "unknown" },
    tldr: {
      headline: "We couldn't analyze this article fully.",
      subhead: "The content may be blocked from automated analysis.",
      paragraphs: [
        "We encountered difficulties extracting the full content from this article.",
        "This often happens with anti-bot protection or dynamic pages.",
        "Please open the original link for complete context."
      ],
    },
    eli5: { summary: "Some sites block robots, so we can’t read enough to explain it well. It’s like trying to read through a locked window.", analogy: "Reading through a locked window." },
    why_it_matters: [
      "Some publishers block automated readers.",
      "Original sources remain authoritative.",
      "Access limits affect automated analysis quality.",
      "Direct reading gives full context."
    ],
    key_points: [
      { text: "Extraction encountered technical barriers", tag: "fact" },
      { text: "Site may use paywall or bot protection", tag: "fact" },
      { text: "Original source recommended for full context", tag: "stakeholders" },
      { text: `Typical success varies by site`, tag: "numbers" },
      { text: "Analysis limited to available metadata", tag: "timeline" },
      { text: "We acknowledge technical limitations", tag: "fact" }
    ],
    perspectives: [
      { label: "Publisher view", summary: "Protection helps sustain journalism.", bullets: ["Paywalls protect revenue", "Bot filters reduce abuse", "Rate limits keep sites responsive", "Rights-holders control distribution"] },
      { label: "Reader view", summary: "Users want quick summaries.", bullets: ["Summaries are convenient", "Paywalls block access", "Multiple sources help", "Original articles matter"] },
    ],
    common_ground: ["Quality journalism needs support", "Original sources are authoritative", "Tech has limits"],
    glossary: [
      { term: "Paywall", definition: "A barrier requiring subscription/payment" },
      { term: "Bot detection", definition: "Systems that filter automated traffic" },
      { term: "Rate limiting", definition: "Restricting request frequency" },
      { term: "Web scraping", definition: "Automated content retrieval" },
      { term: "Content analysis", definition: "Summarizing/explaining text" },
    ],
    bias: { left: biasLeft, center: biasCenter, right: biasRight, confidence: conf, rationale: "Limited text; center-weighted", colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" } },
    tone: "factual",
    sentiment: { positive: pos, neutral: neu, negative: neg, rationale: "Limited input; neutral-leaning" },
    source_mix: getSourceMix(domain, ""),
    reading_time_minutes: Math.max(1, Math.ceil(wc / 200)),
    privacy_note: "Auto-deletes after 24h",
    follow_up_questions: [
      { q: "How can I read the original?", a: "Open the source link directly." },
      { q: "Why do some sites block bots?", a: "To protect content and performance." },
      { q: "What works best?", a: "Open sites without heavy protections." },
    ],
  };
}

/** ========= Gemini map-reduce & final analysis ========= */
const GEM = {
  modelFast: "gemini-1.5-flash",
  modelPro:  "gemini-1.5-pro",
  timeoutMs: 30000,
  chunkChars: 6000,
  finalBudget: 9500,
};

function chunk(text: string, size = GEM.chunkChars) {
  const arr: string[] = [];
  for (let i = 0; i < text.length; i += size) arr.push(text.slice(i, i + size));
  return arr;
}

function modelFor(len: number) {
  return len > 6000 ? GEM.modelPro : GEM.modelFast;
}

async function genWithTimeout(p: Promise<any>) {
  return Promise.race([
    p,
    new Promise((_, r) => setTimeout(() => r(new Error("gemini_timeout")), GEM.timeoutMs)),
  ]);
}

function buildSystem(modeNote = "") {
  return `You are a neutral news explainer. Output ONLY JSON matching the requested schema. No markdown fences.
${modeNote}`;
}

function buildFinalSchema() {
  return `Schema:
{
  "meta":{"title":string,"domain":string,"byline":string,"published_at":string},
  "tldr":{"headline":string,"subhead":string,"paragraphs":["string"]},
  "eli5":{"summary":string,"analogy":string?},
  "why_it_matters":["string"],
  "key_points":[{"text":"string","tag":"fact|timeline|stakeholders|numbers"}],
  "perspectives":[{"label":"string","summary":"string","bullets":["string"]},{"label":"string","summary":"string","bullets":["string"]}],
  "common_ground":["string"],
  "glossary":[{"term":"string","definition":"string","link":string?}],
  "bias":{"left":0-100,"center":0-100,"right":0-100,"confidence":"low|medium|high","rationale":"string"},
  "tone":"factual|neutral|opinionated|satirical",
  "sentiment":{"positive":0-100,"neutral":0-100,"negative":0-100,"rationale":"string"},
  "follow_up_questions":[{"q":"string","a":"string"}]
}`;
}

async function geminiAnalyze(content: string, url: string, extractionConf: "low"|"medium"|"high"): Promise<ArticleAnalysis> {
  const apiKey = geminiApiKey();
  const domain = new URL(url).hostname.replace(/^www\./, "");
  if (!GoogleGenerativeAI || !apiKey) return mockAnalysis(content, url, extractionConf);

  const client = new GoogleGenerativeAI(apiKey);
  const text = content.slice(0, GEM.finalBudget); // hard cap
  const modelName = modelFor(text.length);
  const model = client.getGenerativeModel({ model: modelName, generationConfig: { temperature: 0.2, maxOutputTokens: 2200 } });

  let composed = text;
  if (text.length > GEM.chunkChars * 1.2) {
    const parts = chunk(text);
    const notes: any[] = [];
    for (let i = 0; i < parts.length; i++) {
      const notePrompt = `Return STRICT JSON only:
{"tldr":"string","bullets":["string"],"bias":{"left":0-100,"center":0-100,"right":0-100},"sentiment":{"positive":0-100,"neutral":0-100,"negative":0-100}}
CHUNK ${i + 1}/${parts.length}:
${parts[i]}`;
      const r: any = await genWithTimeout(model.generateContent(notePrompt));
      notes.push(parseFirstJson(r.response.text()));
      await new Promise(r => setTimeout(r, 120));
    }
    composed = notes.map((n, i) =>
      `Chunk ${i + 1} TLDR: ${n.tldr}\nBullets: ${(n.bullets||[]).join("; ")}\nBias L/C/R: ${n.bias?.left}/${n.bias?.center}/${n.bias?.right}\nSent P/N/Neg: ${n.sentiment?.positive}/${n.sentiment?.neutral}/${n.sentiment?.negative}`
    ).join("\n\n").slice(0, GEM.finalBudget);
  }

  const system = buildSystem(extractionConf === "low" ? "You have limited confidence. Be conservative; bias should trend center, sentiment towards neutral." : "");
  const finalPrompt = `${system}

${buildFinalSchema()}

DOMAIN: ${domain}
CONFIDENCE: ${extractionConf}

ARTICLE TEXT OR COMPOSED NOTES:
${composed}`;

  try {
    const res: any = await genWithTimeout(model.generateContent(finalPrompt));
    const parsed = parseFirstJson(res.response.text());

    // Normalize numeric triples
    const b = normalizeBars(
      toInt(parsed?.bias?.left, extractionConf === "low" ? 20 : 33),
      toInt(parsed?.bias?.center, extractionConf === "low" ? 60 : 34),
      toInt(parsed?.bias?.right, extractionConf === "low" ? 20 : 33),
    );
    const s = normalizeBars(
      toInt(parsed?.sentiment?.positive, extractionConf === "low" ? 25 : 34),
      toInt(parsed?.sentiment?.neutral, extractionConf === "low" ? 50 : 34),
      toInt(parsed?.sentiment?.negative, extractionConf === "low" ? 25 : 32),
    );

    // Shape for UI
    const title = sanitizeTitle(String(parsed?.meta?.title || "Untitled article"), domain);
    const analysis: ArticleAnalysis = {
      meta: {
        title,
        domain,
        byline: String(parsed?.meta?.byline || "Unknown"),
        published_at: String(parsed?.meta?.published_at || "unknown"),
      },
      tldr: {
        headline: String(parsed?.tldr?.headline || "Summary unavailable"),
        subhead: String(parsed?.tldr?.subhead || "Please try another article"),
        paragraphs: asArray<string>(parsed?.tldr?.paragraphs).slice(0, 5).filter(Boolean),
      },
      eli5: {
        summary: String(parsed?.eli5?.summary || ""),
        analogy: parsed?.eli5?.analogy ? String(parsed.eli5.analogy) : undefined,
      },
      why_it_matters: asArray<string>(parsed?.why_it_matters).slice(0, 6).filter(Boolean),
      key_points: asArray<any>(parsed?.key_points).slice(0, 10).map((k: any) => ({
        text: String(k?.text || ""),
        tag: (["fact","timeline","stakeholders","numbers"].includes(String(k?.tag)) ? String(k.tag) : "fact") as KeyTag,
      })).filter((k: any) => k.text),
      perspectives: asArray<any>(parsed?.perspectives).slice(0, 2).map((p: any) => ({
        label: String(p?.label || "Perspective"),
        summary: String(p?.summary || ""),
        bullets: asArray<string>(p?.bullets).slice(0, 5).filter(Boolean),
      })),
      common_ground: asArray<string>(parsed?.common_ground).slice(0, 3).filter(Boolean),
      glossary: asArray<any>(parsed?.glossary).slice(0, 8).map((g: any) => ({
        term: String(g?.term || ""),
        definition: String(g?.definition || ""),
        link: g?.link ? String(g.link) : undefined,
      })).filter((g: any) => g.term && g.definition),
      bias: {
        left: b.A, center: b.B, right: b.C,
        confidence: (["low","medium","high"].includes(String(parsed?.bias?.confidence)) ? parsed.bias.confidence : (extractionConf === "low" ? "low" : "medium")) as BiasConfidence,
        rationale: String(parsed?.bias?.rationale || "Based on wording, framing, and quoted voices"),
        colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" },
      },
      tone: (["factual","neutral","opinionated","satirical"].includes(String(parsed?.tone)) ? parsed.tone : "factual") as Tone,
      sentiment: { positive: s.A, neutral: s.B, negative: s.C, rationale: String(parsed?.sentiment?.rationale || "") },
      source_mix: getSourceMix(domain, title),
      reading_time_minutes: Math.max(1, Math.ceil(content.split(/\s+/).filter(Boolean).length / 200)),
      privacy_note: "Auto-deletes after 24h",
      follow_up_questions: asArray<any>(parsed?.follow_up_questions).slice(0, 5).map((q: any) =>
        typeof q === "string" ? { q, a: "Consider how this affects stakeholders and context." } :
        { q: String(q?.q || q?.question || ""), a: String(q?.a || q?.answer || "Consider how this affects stakeholders and context.") }
      ).filter((qa: any) => qa.q),
    };

    return analysis;
  } catch (e) {
    console.error("Gemini final analysis failed:", (e as any)?.message || e);
    return mockAnalysis(content, url, extractionConf);
  }
}

/** ========= Public endpoint ========= */
export const process = api(
  { expose: true, method: "POST", path: "/article/process" },
  async ({ url }: ProcessRequest): Promise<ProcessResponse> => {
    if (!url || typeof url !== "string") return { success: false, error: "Missing url" };
    try { new URL(url); } catch { return { success: false, error: "Invalid url" }; }

    // Rate limit
    const clientIP = "127.0.0.1";
    const rate = memoryStore.checkRateLimit(clientIP);
    if (!rate.allowed) {
      return { success: false, error: "Rate limit exceeded", rateLimited: true, remaining: rate.remaining, resetTime: rate.resetTime };
    }

    // Cache
    const key = `${new URL(url).hostname}${new URL(url).pathname}`;
    const cached = memoryStore.getCached(key);
    if (cached) return { success: true, id: cached.id, remaining: rate.remaining, resetTime: rate.resetTime };

    // Extract → Analyze
    const extracted = await extractTextFromUrl(url);
    const analysis = await geminiAnalyze(extracted.text, url, extracted.confidence);

    // Persist (cap content to avoid oversized rows)
    const id = randomUUID();
    const tldrParagraphsJson = JSON.stringify(analysis.tldr.paragraphs || []);
    const whyJson = JSON.stringify(analysis.why_it_matters || []);
    const pointsJson = JSON.stringify(analysis.key_points || []);
    const perspectivesJson = JSON.stringify(analysis.perspectives || []);
    const commonJson = JSON.stringify(analysis.common_ground || []);
    const glossaryJson = JSON.stringify(analysis.glossary || []);
    const followupsJson = JSON.stringify(analysis.follow_up_questions || []);
    const contentToStore = extracted.text.slice(0, 20000); // keep DB happy

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
          ${id},
          ${url},
          ${analysis.meta.title},
          ${contentToStore},
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
      const rowsArray: any[] = [];
      for await (const row of rows) rowsArray.push(row);

      memoryStore.setCached(key, { id });
      return { success: true, id, remaining: rate.remaining, resetTime: rate.resetTime };
    } catch (e) {
      console.error("Database error:", e);
      return { success: false, error: "Failed to save article" };
    }
  }
);
