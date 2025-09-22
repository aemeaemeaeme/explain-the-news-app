import { secret } from "encore.dev/config";

/* ---------- Dynamic import for Gemini (works in serverless) ---------- */
let GoogleGenerativeAI: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const geminiModule = require("@google/generative-ai");
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (error) {
  console.warn("Google Generative AI package not available:", error);
}

/* ---------- Types (unchanged externally) ---------- */
export interface AnalysisResponse {
  status: "full" | "limited";
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: "factual" | "analytical" | "opinion" | "mixed";
    provider: "gemini";
    model: string;
    fallback_used: false;
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: "fact" | "numbers" | "timeline" | "stakeholders" | "quote";
    text: string;
  }>;
  bias_analysis: {
    left: number;
    center: number;
    right: number;
    confidence: "low" | "med" | "high";
    notes: string;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    notes: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{ term: string; definition: string }>;
  followups: string[];
  processing_notes: string[];
}

/* ---------- Config ---------- */
const geminiApiKey = secret("GEMINI_API_KEY");

const PROVIDER_CONFIG = {
  gemini: {
    model_fast: "gemini-1.5-flash",
    model_pro: "gemini-1.5-pro",
    timeout_ms: 30000,
    retries: 1,
    // crude but safe character budgets to avoid context overflow
    chunk_chars: 6000,
    final_chars: 9500,
  },
} as const;

/* ---------- Small helpers ---------- */
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function normalizeToHundred(a: number, b: number, c: number): [number, number, number] {
  const total = a + b + c;
  if (!isFinite(total) || total <= 0) return [33, 34, 33];
  const scale = 100 / total;
  const A = Math.round(a * scale);
  const B = Math.round(b * scale);
  const C = 100 - A - B;
  return [Math.max(0, A), Math.max(0, B), Math.max(0, C)];
}

function stripCodeFences(s: string): string {
  let out = s.trim();
  if (out.startsWith("```")) {
    out = out.replace(/^```[a-zA-Z0-9]*\s*/m, "").replace(/\s*```$/m, "").trim();
  }
  return out;
}

function safeParseFirstJson(s: string): any {
  const text = stripCodeFences(s);
  // Try straight parse
  try { return JSON.parse(text); } catch {}
  // Try to extract the first {...} block
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const candidate = text.slice(start, end + 1);
    try { return JSON.parse(candidate); } catch {}
  }
  throw new Error("Gemini returned non-JSON content");
}

function createSystemPrompt(mode: "full" | "limited"): string {
  return `You are Unspin, a neutral news explainer. You will output ONLY JSON following this schema. 
No markdown, no commentary outside JSON. If you are in limited mode, be conservative and mark confidence low.

JSON schema (keys and types must match exactly):
{
  "tldr": "string",
  "eli5": "string",
  "why_it_matters": ["string"],
  "key_points": [{"tag":"fact|numbers|timeline|stakeholders|quote","text":"string"}],
  "bias_analysis": {"left":0-100,"center":0-100,"right":0-100,"confidence":"low|med|high","notes":"string"},
  "sentiment": {"positive":0-100,"neutral":0-100,"negative":0-100,"notes":"string"},
  "perspectives": {"left_view":["string"],"center_view":["string"],"right_view":["string"]},
  "common_ground": ["string"],
  "glossary": [{"term":"string","definition":"string"}],
  "followups": ["string"]
}
${mode === "limited" ? "NOTE: You have only headline/metadata or thin text. Avoid speculating; keep values generic, confidence 'low'." : ""}`;
}

function chooseGeminiModel(textLength: number, limited: boolean): string {
  if (limited) return PROVIDER_CONFIG.gemini.model_fast;
  return textLength > 6000 ? PROVIDER_CONFIG.gemini.model_pro : PROVIDER_CONFIG.gemini.model_fast;
}

/* ---------- Core Gemini wrappers ---------- */
function getModel(apiKey: string, modelName: string) {
  const client = new GoogleGenerativeAI(apiKey);
  return client.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2500,
    },
  });
}

async function genWithTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Gemini timeout")), ms)),
  ]) as Promise<T>;
}

/* ---------- Map-reduce chunking ---------- */
function chunkText(text: string, n = PROVIDER_CONFIG.gemini.chunk_chars): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += n) {
    chunks.push(text.slice(i, i + n));
  }
  return chunks;
}

async function summarizeChunk(model: any, sysPrompt: string, meta: any, chunk: string, idx: number, total: number) {
  const prompt = `${sysPrompt}

You are summarizing chunk ${idx + 1} of ${total} from the same article.
Return a compact JSON with these fields ONLY:
{
  "tldr":"string",
  "bullets":["string"],
  "bias":{"left":0-100,"center":0-100,"right":0-100},
  "sentiment":{"positive":0-100,"neutral":0-100,"negative":0-100}
}

META:
${JSON.stringify(meta)}

CHUNK_TEXT:
${chunk}
`;
  const res: any = await genWithTimeout(model.generateContent(prompt), PROVIDER_CONFIG.gemini.timeout_ms);
  return safeParseFirstJson(res.response.text());
}

/* ---------- Public entry: build final JSON once ---------- */
export async function analyzeWithProviders(extractResult: {
  status: "full" | "limited";
  meta: any;           // { title, source, author, published, reading_minutes, tone }
  content: string;     // CLEAN TEXT (use fetch.ts -> text)
  processing_notes: string[];
}): Promise<AnalysisResponse> {
  if (!GoogleGenerativeAI) throw new Error("Google Generative AI package not available");
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured");

  const limited = extractResult.status === "limited";
  const baseNotes = [...(extractResult.processing_notes || [])];

  const text = (extractResult.content || "").slice(0, PROVIDER_CONFIG.gemini.final_chars);
  const modelName = chooseGeminiModel(text.length, limited);
  const model = getModel(apiKey, modelName);
  const systemPrompt = createSystemPrompt(extractResult.status);

  try {
    let composedContext = text;

    // If very long, map-reduce first to avoid timeouts
    if (!limited && text.length > PROVIDER_CONFIG.gemini.chunk_chars * 1.2) {
      const parts = chunkText(text);
      const partials = [];
      for (let i = 0; i < parts.length; i++) {
        const pj = await summarizeChunk(model, "You are helping create a final article analysis.", extractResult.meta, parts[i], i, parts.length);
        partials.push(pj);
        // light backoff to be nice to rate limits
        await new Promise(r => setTimeout(r, 150));
      }
      // Compose a compact context from partials for final pass
      const mini = partials.map((p: any, i: number) =>
        `Chunk ${i + 1} TLDR: ${p.tldr}\nBullets: ${Array.isArray(p.bullets) ? p.bullets.join("; ") : ""}\nBias: L${p.bias?.left}/C${p.bias?.center}/R${p.bias?.right}\nSentiment: P${p.sentiment?.positive}/N${p.sentiment?.neutral}/Neg${p.sentiment?.negative}`
      ).join("\n\n");
      composedContext = mini.slice(0, PROVIDER_CONFIG.gemini.final_chars);
      baseNotes.push(`Map-reduce: ${parts.length} chunks -> composed summary (~${composedContext.length} chars).`);
    }

    // Final single call → full structured JSON
    const finalPrompt = `${systemPrompt}

ARTICLE_META:
${JSON.stringify(extractResult.meta)}

ARTICLE_TEXT_OR_COMPOSED_SUMMARY:
${composedContext}
`;

    const res: any = await genWithTimeout(model.generateContent(finalPrompt), PROVIDER_CONFIG.gemini.timeout_ms);
    const parsed = safeParseFirstJson(res.response.text());

    // Normalize percentages defensively
    if (parsed?.bias_analysis) {
      const [l, c, r] = normalizeToHundred(
        Number(parsed.bias_analysis.left ?? 33),
        Number(parsed.bias_analysis.center ?? 34),
        Number(parsed.bias_analysis.right ?? 33)
      );
      parsed.bias_analysis.left = l; parsed.bias_analysis.center = c; parsed.bias_analysis.right = r;
      parsed.bias_analysis.confidence = parsed.bias_analysis.confidence || (limited ? "low" : "med");
    }
    if (parsed?.sentiment) {
      const [p, n, neg] = normalizeToHundred(
        Number(parsed.sentiment.positive ?? 33),
        Number(parsed.sentiment.neutral ?? 34),
        Number(parsed.sentiment.negative ?? 33)
      );
      parsed.sentiment.positive = p; parsed.sentiment.neutral = n; parsed.sentiment.negative = neg;
      parsed.sentiment.notes = parsed.sentiment.notes || (limited ? "Limited input; conservative estimate" : "Estimated from article framing/wording");
    }

    return {
      ...parsed,
      status: extractResult.status,
      meta: {
        ...extractResult.meta,
        provider: "gemini",
        model: modelName,
        fallback_used: false,
      },
      processing_notes: [...baseNotes, `Analyzed with Gemini ${modelName}`],
    };

  } catch (error: any) {
    console.error("❌ Gemini analysis failed:", error?.message || error);

    // Consistent, graceful fallback so UI never breaks
    return {
      status: "limited",
      meta: {
        ...extractResult.meta,
        provider: "gemini",
        model: "error",
        fallback_used: false,
      },
      tldr: "Analysis temporarily unavailable. Gemini could not process this content right now.",
      eli5: "We hit a temporary error analyzing this article. Try again in a minute or paste the text directly.",
      why_it_matters: [
        "Service reliability affects the reading experience.",
        "Temporary rate limits or timeouts usually clear after a retry."
      ],
      key_points: [
        { tag: "fact", text: "The analyzer returned an error or timeout." },
        { tag: "timeline", text: "Please retry shortly or use pasted text." }
      ],
      bias_analysis: {
        left: 0, center: 100, right: 0,
        confidence: "low",
        notes: "Cannot analyze bias without successful processing."
      },
      sentiment: {
        positive: 0, neutral: 100, negative: 0,
        notes: "Cannot analyze sentiment without successful processing."
      },
      perspectives: { left_view: [], center_view: [], right_view: [] },
      common_ground: ["Original sources remain authoritative"],
      glossary: [
        { term: "Timeout", definition: "The request took too long and was aborted." },
        { term: "Rate limit", definition: "Too many requests were sent in a short time." }
      ],
      followups: [
        "Retry this article later.",
        "Try a different outlet for the same story.",
        "Paste the article text instead of the URL."
      ],
      processing_notes: [...baseNotes, `Gemini error: ${error?.message || "unknown"}`],
    };
  }
}
