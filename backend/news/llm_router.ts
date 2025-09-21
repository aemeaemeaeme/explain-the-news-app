import { secret } from "encore.dev/config";

// Dynamic import for Gemini to handle potential package issues
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
  key_points: Array<{
    tag: "fact" | "timeline" | "numbers" | "stakeholders";
    text: string;
  }>;
  bias: {
    left_pct: number;
    center_pct: number;
    right_pct: number;
    confidence: "low" | "medium" | "high";
    note: string;
  };
  sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    note: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{ term: string; definition: string }>;
  errors: Array<{ code: string; message: string }>;
}

/** ---------- Config ---------- */
const geminiApiKey = secret("GEMINI_API_KEY");

const PROVIDER_CONFIG = {
  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    timeout: 30000,
    retries: 1,
  },
} as const;

/** ---------- Helpers ---------- */
function normalizeToHundred(a: number, b: number, c: number): [number, number, number] {
  const total = a + b + c;
  if (total === 0) return [0, 100, 0];
  const scale = 100 / total;
  const A = Math.round(a * scale);
  const B = Math.round(b * scale);
  const C = 100 - A - B;
  return [Math.max(0, A), Math.max(0, B), Math.max(0, C)];
}

function validateResponse(response: any): Omit<UnifiedAnalysisResponse, "meta" | "errors"> | null {
  try {
    if (!response || typeof response !== "object") return null;

    // Bias
    const [left_pct, center_pct, right_pct] = normalizeToHundred(
      Number(response.bias?.left_pct ?? response.bias?.left ?? 33),
      Number(response.bias?.center_pct ?? response.bias?.center ?? 34),
      Number(response.bias?.right_pct ?? response.bias?.right ?? 33)
    );

    // Sentiment
    const [positive_pct, neutral_pct, negative_pct] = normalizeToHundred(
      Number(response.sentiment?.positive_pct ?? response.sentiment?.positive ?? 34),
      Number(response.sentiment?.neutral_pct ?? response.sentiment?.neutral ?? 33),
      Number(response.sentiment?.negative_pct ?? response.sentiment?.negative ?? 33)
    );

    return {
      header: {
        title: String(response.header?.title || response.title || "Untitled"),
        byline: response.header?.byline || response.byline || null,
        read_time_min: Number(response.header?.read_time_min || response.read_time_min) || null,
        tone: (response.header?.tone || response.tone || "unknown") as UnifiedAnalysisResponse["header"]["tone"],
      },
      tldr: String(response.tldr || "Summary not available"),
      eli5: String(response.eli5 || "Simplified explanation not available"),
      why_it_matters: Array.isArray(response.why_it_matters) ? response.why_it_matters.slice(0, 6) : [],
      key_points: Array.isArray(response.key_points)
        ? response.key_points.slice(0, 10).map((p: any) => ({
            tag: (["fact", "timeline", "numbers", "stakeholders"].includes(p.tag) ? p.tag : "fact") as
              | "fact"
              | "timeline"
              | "numbers"
              | "stakeholders",
            text: String(p.text || ""),
          })).filter((p: any) => p.text)
        : [],
      bias: {
        left_pct,
        center_pct,
        right_pct,
        confidence: (response.bias?.confidence || "medium") as "low" | "medium" | "high",
        note: String(response.bias?.note || response.bias?.rationale || "Analysis based on content framing"),
      },
      sentiment: {
        positive_pct,
        neutral_pct,
        negative_pct,
        note: String(response.sentiment?.note || response.sentiment?.rationale || "Based on language and tone analysis"),
      },
      perspectives: {
        left_view: Array.isArray(response.perspectives?.left_view) ? response.perspectives.left_view.slice(0, 5) : [],
        center_view: Array.isArray(response.perspectives?.center_view) ? response.perspectives.center_view.slice(0, 5) : [],
        right_view: Array.isArray(response.perspectives?.right_view) ? response.perspectives.right_view.slice(0, 5) : [],
      },
      common_ground: Array.isArray(response.common_ground) ? response.common_ground.slice(0, 4) : [],
      glossary: Array.isArray(response.glossary)
        ? response.glossary
            .slice(0, 8)
            .map((g: any) => ({ term: String(g.term || ""), definition: String(g.definition || "") }))
            .filter((g: any) => g.term && g.definition)
        : [],
    };
  } catch (e) {
    console.error("Response validation failed:", e);
    return null;
  }
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
- bias and sentiment percentages must sum to 100
- Never fabricate quotes or specific details not in the text
- Use varied, realistic percentages based on actual content analysis
- If limited extraction, state uncertainties clearly
${isLimited ? "- Note that full article text was not available; analysis is based on limited content" : ""}
- Return ONLY the JSON, no additional text`;
}

/** ---------- Gemini call ---------- */
async function callGemini(prompt: string, articleData: any) {
  if (!GoogleGenerativeAI) throw new Error("Google Generative AI package not available");

  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured");

  const client = new GoogleGenerativeAI(apiKey);
  const model = client.getGenerativeModel({
    model: PROVIDER_CONFIG.gemini.model,
    generationConfig: { temperature: 0.3, maxOutputTokens: 2500 },
  });

  const fullPrompt = `${prompt}\n\nArticle data: ${JSON.stringify(articleData)}`;
  const startTime = Date.now();

  const response = await Promise.race([
    model.generateContent(fullPrompt),
    new Promise((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_CONFIG.gemini.timeout)),
  ]);

  const result = (response as any).response;
  if (!result) throw new Error("No response from Gemini");

  let content = result.text();
  if (!content) throw new Error("No text content in Gemini response");

  // strip code fences if present
  content = content.trim();
  if (content.startsWith("```json")) content = content.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  if (content.startsWith("```")) content = content.replace(/^```\s*/, "").replace(/\s*```$/, "");

  const parsed = JSON.parse(content);
  const validated = validateResponse(parsed);
  if (!validated) throw new Error("Gemini response validation failed");

  const elapsed_ms = Date.now() - startTime;

  const meta: UnifiedAnalysisResponse["meta"] = {
    provider: "gemini",
    model: PROVIDER_CONFIG.gemini.model,
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
  const articleData = {
    url,
    title,
    text: articleText,
    word_count: articleText.split(/\s+/).length,
    limited: isLimited,
  };

  const errors: UnifiedAnalysisResponse["errors"] = [];

  try {
    console.log("🔮 Attempting Gemini analysis");
    const { validated, meta } = await callGemini(systemPrompt, articleData);

    const result: UnifiedAnalysisResponse = {
      meta: {
        ...meta,
        url,
        site: new URL(url).hostname,
        status: isLimited ? "limited" : "full",
      },
      ...validated,
      errors,
    };

    console.log(`✅ Gemini analysis completed (${result.meta.elapsed_ms}ms)`);
    return result;
  } catch (err: any) {
    const message = err?.message || String(err);
    console.error("❌ Gemini failed:", message);
    errors.push({ code: "gemini_error", message });

    // Hard error response that preserves frontend expectations
    return {
      meta: {
        provider: "gemini",
        model: "error",
        elapsed_ms: 0,
        site: new URL(url).hostname,
        url,
        status: "error",
      },
      header: {
        title: title || "Analysis Failed",
        byline: null,
        read_time_min: null,
        tone: "unknown",
      },
      tldr: "Analysis temporarily unavailable. Gemini could not process this content right now.",
      eli5: "Our analyzer had trouble. Try again later or open the original article.",
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
