import { secret } from "encore.dev/config";
// If you have the CONFIG helper, import it (optional):
// import { CONFIG, getGeminiModelFor } from "./config";

// --- Dynamic import for Gemini ---
let GoogleGenerativeAI: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const geminiModule = require("@google/generative-ai");
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (error) {
  console.warn("Google Generative AI package not available:", error);
}

/** ---------- Types ---------- */
export interface UnifiedAnalysisResponse {
  meta: {
    provider: "gemini";
    model: string;
    elapsed_ms: number;
    site: string | null;
    url: string;
    status: "full" | "limited" | "error";
  };
  header: {
    title: string;
    byline: string | null;
    read_time_min: number | null;
    tone: "factual" | "neutral" | "mixed" | "opinion" | "unknown";
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{ tag: "fact" | "timeline" | "numbers" | "stakeholders"; text: string }>;
  bias: {
    left_pct: number;
    center_pct: number;
    right_pct: number;
    confidence: "low" | "medium" | "high";
    note: string;
  };
  sentiment: { positive_pct: number; neutral_pct: number; negative_pct: number; note: string };
  perspectives: { left_view: string[]; center_view: string[]; right_view: string[] };
  common_ground: string[];
  glossary: Array<{ term: string; definition: string }>;
  errors: Array<{ code: string; message: string }>;
}

/** ---------- Config ---------- */
const geminiApiKey = secret("GEMINI_API_KEY");
const PROVIDER_CONFIG = {
  gemini: {
    model_fast: process.env.GEMINI_MODEL_FAST || process.env.GEMINI_MODEL || "gemini-1.5-flash",
    model_pro: process.env.GEMINI_MODEL_PRO || "gemini-1.5-pro",
    timeout: 30000,
    retries: 1,
  },
} as const;

/** ---------- Helpers ---------- */
const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

function normalizeToHundred(a: number, b: number, c: number): [number, number, number] {
  const A = clamp(a), B = clamp(b), C = clamp(c);
  let sum = A + B + C;
  if (sum <= 0) return [0, 100, 0];
  if (sum !== 100) {
    const s = 100 / sum;
    const nA = Math.round(A * s);
    const nB = Math.round(B * s);
    const nC = 100 - nA - nB;
    return [clamp(nA), clamp(nB), clamp(nC)];
  }
  return [A, B, C];
}

function coerceTag(tag: any): "fact" | "timeline" | "numbers" | "stakeholders" {
  const t = String(tag || "").toLowerCase();
  if (t === "timeline") return "timeline";
  if (t === "numbers" || t === "number") return "numbers";
  if (t === "stakeholders" || t === "stakeholder") return "stakeholders";
  return "fact";
}

function stripFences(s: string): string {
  let x = (s || "").trim();
  if (x.startsWith("```")) x = x.replace(/^```[a-z0-9]*\s*/i, "").replace(/\s*```$/i, "").trim();
  return x;
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

function validateResponse(response: any): Omit<UnifiedAnalysisResponse, "meta" | "errors"> | null {
  if (!response || typeof response !== "object") return null;

  const [left_pct, center_pct, right_pct] = normalizeToHundred(
    response.bias?.left_pct ?? response.bias?.left ?? 33,
    response.bias?.center_pct ?? response.bias?.center ?? 34,
    response.bias?.right_pct ?? response.bias?.right ?? 33
  );

  const [positive_pct, neutral_pct, negative_pct] = normalizeToHundred(
    response.sentiment?.positive_pct ?? response.sentiment?.positive ?? 34,
    response.sentiment?.neutral_pct ?? response.sentiment?.neutral ?? 33,
    response.sentiment?.negative_pct ?? response.sentiment?.negative ?? 33
  );

  const kp = Array.isArray(response.key_points) ? response.key_points : [];
  const perspectives = response.perspectives || {};

  return {
    header: {
      title: String(response.header?.title || response.title || "Untitled"),
      byline: response.header?.byline ?? response.byline ?? null,
      read_time_min: Number(response.header?.read_time_min ?? response.read_time_min) || null,
      tone: (response.header?.tone || response.tone || "unknown") as UnifiedAnalysisResponse["header"]["tone"],
    },
    tldr: String(response.tldr || "Summary not available"),
    eli5: String(response.eli5 || "Simplified explanation not available"),
    why_it_matters: Array.isArray(response.why_it_matters) ? response.why_it_matters.slice(0, 6) : [],
    key_points: kp.slice(0, 10).map((p: any) => ({ tag: coerceTag(p?.tag), text: String(p?.text || "") }))
      .filter((p: any) => p.text),
    bias: {
      left_pct, center_pct, right_pct,
      confidence: (response.bias?.confidence || "medium") as "low" | "medium" | "high",
      note: String(response.bias?.note || response.bias?.rationale || "Analysis based on content framing"),
    },
    sentiment: {
      positive_pct, neutral_pct, negative_pct,
      note: String(response.sentiment?.note || response.sentiment?.rationale || "Based on language and tone analysis"),
    },
    perspectives: {
      left_view: Array.isArray(perspectives.left_view) ? perspectives.left_view.slice(0, 5) : [],
      center_view: Array.isArray(perspectives.center_view) ? perspectives.center_view.slice(0, 5) : [],
      right_view: Array.isArray(perspectives.right_view) ? perspectives.right_view.slice(0, 5) : [],
    },
    common_ground: Array.isArray(response.common_ground) ? response.common_ground.slice(0, 4) : [],
    glossary: Array.isArray(response.glossary)
      ? response.glossary.slice(0, 8).map((g: any) => ({
          term: String(g?.term || ""),
          definition: String(g?.definition || "")
        })).filter((g: any) => g.term && g.definition)
      : [],
  };
}

function createSystemPrompt(isLimited: boolean): string {
  return `You are an impartial news analysis assistant. Analyze the provided article and return ONLY valid JSON matching this exact schema:

{
  "header": {"title":"string","byline":"string|null","read_time_min":number,"tone":"factual|neutral|mixed|opinion|unknown"},
  "tldr":"1-2 sentence summary",
  "eli5":"Simple explanation for general audience",
  "why_it_matters":["bullet1","bullet2"],
  "key_points":[{"tag":"fact|timeline|numbers|stakeholders","text":"point"}],
  "bias":{"left_pct":0-100,"center_pct":0-100,"right_pct":0-100,"confidence":"low|medium|high","note":"explanation"},
  "sentiment":{"positive_pct":0-100,"neutral_pct":0-100,"negative_pct":0-100,"note":"explanation"},
  "perspectives":{"left_view":["bullet"],"center_view":["bullet"],"right_view":["bullet"]},
  "common_ground":["shared point"],
  "glossary":[{"term":"term","definition":"definition"}]
}

CRITICAL RULES:
- Percentages for bias and sentiment must sum to 100
- Never fabricate quotes or specific details not in the text
- Use varied, realistic percentages based on actual content analysis
- ${isLimited ? "You have limited text; call out uncertainty" : "Full text available"}
- Return ONLY the JSON, no additional text`;
}

/** ---------- Gemini call ---------- */
async function callGemini(prompt: string, articleData: any, inputLength: number) {
  if (!GoogleGenerativeAI) throw new Error("Google Generative AI package not available");

  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured");

  const modelName =
    // If you’ve got getGeminiModelFor from config, prefer it:
    // getGeminiModelFor(inputLength, articleData?.limited)
    (inputLength > 6000 ? PROVIDER_CONFIG.gemini.model_pro : PROVIDER_CONFIG.gemini.model_fast);

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: modelName,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
  });

  const fullPrompt = `${prompt}\n\nArticle data: ${JSON.stringify(articleData)}`;
  const start = Date.now();

  const response = await Promise.race([
    model.generateContent(fullPrompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_CONFIG.gemini.timeout)),
  ]);

  const result = (response as any).response;
  if (!result) throw new Error("No response from Gemini");

  let content = result.text();
  if (!content) throw new Error("No text content in Gemini response");

  const parsed = parseFirstJson(content);
  const validated = validateResponse(parsed);
  if (!validated) throw new Error("Gemini response validation failed");

  const elapsed_ms = Date.now() - start;

  const meta: UnifiedAnalysisResponse["meta"] = {
    provider: "gemini",
    model: modelName,
    elapsed_ms,
    site: null,
    url: "",
    status: "full",
  };

  return { validated, meta };
}

/** ---------- Main (Gemini only) ---------- */
export async function analyzeWithLLM(
  articleText: string,
  url: string,
  title: string,
  isLimited = false
): Promise<UnifiedAnalysisResponse> {
  const systemPrompt = createSystemPrompt(isLimited);
  const word_count = (articleText || "").split(/\s+/).filter(Boolean).length;

  let site: string | null = null;
  try { site = new URL(url).hostname; } catch { site = null; }

  const articleData = {
    url,
    title,
    text: articleText,
    word_count,
    limited: isLimited,
  };

  const errors: UnifiedAnalysisResponse["errors"] = [];

  try {
    const { validated, meta } = await callGemini(systemPrompt, articleData, articleText.length);

    const result: UnifiedAnalysisResponse = {
      meta: {
        ...meta,
        url,
        site,
        status: isLimited ? "limited" : "full",
      },
      ...validated,
      errors,
    };

    return result;
  } catch (err: any) {
    const message = err?.message || String(err);
    errors.push({ code: "gemini_error", message });

    return {
      meta: {
        provider: "gemini",
        model: "error",
        elapsed_ms: 0,
        site,
        url,
        status: "error",
      },
      header: { title: title || "Analysis Failed", byline: null, read_time_min: null, tone: "unknown" },
      tldr: "Analysis temporarily unavailable.",
      eli5: "We had trouble analyzing this article right now.",
      why_it_matters: [
        "Service reliability affects the reading experience",
        "Temporary limits or timeouts usually clear after a retry",
      ],
      key_points: [
        { tag: "fact", text: "The analyzer returned an error or timeout." },
        { tag: "timeline", text: "Please retry in a few minutes." },
        { tag: "stakeholders", text: "You can also paste the article text instead of a URL." },
      ],
      bias: { left_pct: 0, center_pct: 100, right_pct: 0, confidence: "low", note: "Not enough data" },
      sentiment: { positive_pct: 0, neutral_pct: 100, negative_pct: 0, note: "Not enough data" },
      perspectives: { left_view: [], center_view: [], right_view: [] },
      common_ground: ["Original sources remain authoritative"],
      glossary: [
        { term: "Timeout", definition: "The request took too long and was aborted." },
        { term: "Rate limit", definition: "Too many requests were sent in a short time." },
      ],
      errors,
    };
  }
}
