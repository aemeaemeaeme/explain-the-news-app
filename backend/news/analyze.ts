// backend/news/analyze.ts
import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import OpenAI from "openai";

/** ================== Types (unchanged) ================== */
interface AnalyzeRequest {
  url: string;
  site: string;
  title: string;
  byline: string | null;
  estReadMin: number;
  text: string;            // CLEAN article text from fetch.ts
}

interface AnalyzeResponse {
  limited?: boolean;
  reason?: string;
  advice?: string;
  meta?: {
    title: string;
    site: string;
    byline: string | null;
    readMinutes: number;
    tone: "factual" | "neutral" | "analytical" | "opinion" | "uncertain";
  };
  tldr?: string;
  eli5?: string;
  whyItMatters?: string[];
  keyPoints?: Array<{
    label: "fact" | "quote" | "number" | "timeline" | "stakeholder" | "context";
    text: string;
  }>;
  biasAnalysis?: {
    left: number;
    center: number;
    right: number;
    confidence: "low" | "medium" | "high";
    rationale: string;
  };
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    note: string;
  };
  perspectives?: Array<{
    title: string;
    bullets: string[];
  }>;
  commonGround?: string[];
  glossary?: Array<{ term: string; definition: string }>;
  followUps?: string[];
}

/** ================== Config ================== */
// Try both names so you don’t get blocked by a secret-name mismatch.
const OPENAI_PRIMARY = secret("OPENAI_API_KEY");
const OPENAI_LEGACY  = secret("OpenAIKey");

const CFG = {
  model: "gpt-4o-mini",
  timeoutMs: 30000,
  chunkChars: 6000,     // size for map-reduce
  finalBudget: 9500,    // guard input to final prompt
};

/** ================== Helpers ================== */
function cleanTitle(raw: string, site: string): string {
  let t = (raw || "").trim();
  const patterns = [
    / - CNN$/i, / \| Reuters$/i, / \(AP\)$/i, / - Associated Press$/i,
    / - NPR$/i, / - BBC$/i, / - The Guardian$/i, / - Washington Post$/i,
    / - New York Times$/i, / - NBC News$/i, / - ABC News$/i, / - CBS News$/i, / - Fox News$/i,
    new RegExp(` - ${site}$`, "i"), new RegExp(` \\| ${site}$`, "i"), new RegExp(` \\(${site}\\)$`, "i"),
  ];
  for (const rx of patterns) t = t.replace(rx, "");
  return t.trim();
}

function stripFences(s: string): string {
  let x = (s || "").trim();
  if (x.startsWith("```")) x = x.replace(/^```[a-zA-Z0-9]*\s*/m, "").replace(/\s*```$/m, "").trim();
  return x;
}

function parseFirstJson(s: string): any {
  const txt = stripFences(s);
  try { return JSON.parse(txt); } catch {}
  const start = txt.indexOf("{"), end = txt.lastIndexOf("}");
  if (start >= 0 && end > start) {
    const cand = txt.slice(start, end + 1);
    try { return JSON.parse(cand); } catch {}
  }
  throw new Error("non_json");
}

function normalize100(a: number, b: number, c: number): [number, number, number] {
  const A = Number.isFinite(a) ? a : 0, B = Number.isFinite(b) ? b : 0, C = Number.isFinite(c) ? c : 0;
  const sum = A + B + C;
  if (sum <= 0) return [33, 34, 33];
  const s = 100 / sum;
  const nA = Math.round(A * s);
  const nB = Math.round(B * s);
  const nC = 100 - nA - nB;
  return [Math.max(0, nA), Math.max(0, nB), Math.max(0, nC)];
}

function chunk(text: string, size = CFG.chunkChars): string[] {
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("timeout")), ms))]) as Promise<T>;
}

/** ================== Prompts ================== */
const SYSTEM = `YOU ARE: "Unspin Analyzer" — produce concise, neutral, bias-aware news analysis from provided article TEXT only. No browsing. No fabrication. Output STRICT JSON only.`;

const FINAL_SCHEMA = `OUTPUT (STRICT JSON)
{
  "meta": {"title": string, "site": string, "byline": string|null, "readMinutes": number, "tone": "factual"|"neutral"|"analytical"|"opinion"|"uncertain"},
  "tldr": string,
  "eli5": string,
  "whyItMatters": ["string"],
  "keyPoints": [{"label":"fact|quote|number|timeline|stakeholder|context","text":"string"}],
  "biasAnalysis": {"left": number, "center": number, "right": number, "confidence":"low"|"medium"|"high", "rationale": string},
  "sentiment": {"positive": number, "neutral": number, "negative": number, "note": string},
  "perspectives": [{"title": string, "bullets": ["string"]}, {"title": string, "bullets": ["string"]}],
  "commonGround": ["string"],
  "glossary": [{"term":"string","definition":"string"}],
  "followUps": ["string"]
}

RULES
• Use only the provided text.
• Numbers for bias/sentiment must sum to 100 naturally (no fixed defaults).
• Keep TLDR tight (1–2 sentences); ELI5 simple (4–6 sentences).`;

function chunkPrompt(meta: any, chunkText: string, idx: number, total: number) {
  return `You are creating notes for a larger article analysis.
Chunk ${idx + 1} of ${total}. Return STRICT JSON:
{"tldr":"string","bullets":["string"],"bias":{"left":0-100,"center":0-100,"right":0-100},"sentiment":{"positive":0-100,"neutral":0-100,"negative":0-100}}

META: ${JSON.stringify(meta)}
TEXT:
${chunkText}`;
}

/** ================== API ================== */
export const analyze = api<AnalyzeRequest, AnalyzeResponse>(
  { expose: true, method: "POST", path: "/analyze" },
  async ({ url, site, title, byline, estReadMin, text }) => {
    console.log(`🧠 Starting analysis for: ${site} (${text.length} chars)`);

    if (!text || text.length < 800) {
      return { limited: true, reason: "insufficient_text", advice: "Open the original article for full context or paste the text directly." };
    }

    const apiKey = OPENAI_PRIMARY() || OPENAI_LEGACY();
    if (!apiKey) {
      return { limited: true, reason: "api_not_configured", advice: "OpenAI key missing. Set OPENAI_API_KEY in Secrets." };
    }

    const openai = new OpenAI({ apiKey });
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const meta = { title, site, byline, readMinutes: estReadMin, tone: "neutral" as const };

    try {
      let composed = text.slice(0, CFG.finalBudget);

      // Map-reduce if article is long
      if (text.length > CFG.chunkChars * 1.2) {
        const parts = chunk(text);
        const notes: Array<{ tldr: string; bullets: string[]; bias?: any; sentiment?: any }> = [];
        for (let i = 0; i < parts.length; i++) {
          const resp = await withTimeout(
            openai.chat.completions.create({
              model: CFG.model,
              temperature: 0.2,
              max_tokens: 600,
              messages: [
                { role: "system", content: "Return STRICT JSON only." },
                { role: "user", content: chunkPrompt(meta, parts[i], i, parts.length) },
              ],
            }),
            CFG.timeoutMs
          );
          const txt = (resp as any).choices?.[0]?.message?.content ?? "";
          notes.push(parseFirstJson(txt));
          await new Promise(r => setTimeout(r, 120)); // small backoff
        }
        composed = notes.map((n, i) =>
          `Chunk ${i + 1} TLDR: ${n.tldr}\nBullets: ${(n.bullets || []).join("; ")}\nBias L/C/R: ${n.bias?.left}/${n.bias?.center}/${n.bias?.right}\nSentiment P/N/Neg: ${n.sentiment?.positive}/${n.sentiment?.neutral}/${n.sentiment?.negative}`
        )
