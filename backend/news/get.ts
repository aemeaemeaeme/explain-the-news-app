// backend/news/get.ts
import { api } from "encore.dev/api";
import db from "../db";

// ---------------- Types returned to the frontend ----------------
export interface Article {
  meta: { title: string; domain: string; byline: string; published_at: string };
  tldr: { headline: string; subhead: string; paragraphs: string[] };
  eli5: { summary: string; analogy?: string };
  why_it_matters: string[];
  key_points: Array<{ text: string; tag: "fact" | "timeline" | "stakeholders" | "numbers" }>;
  perspectives: Array<{ label: string; summary: string; bullets: string[] }>;
  common_ground: string[];
  glossary: Array<{ term: string; definition: string; link?: string }>;
  bias: {
    left: number; center: number; right: number;
    confidence: "low" | "medium" | "high";
    rationale: string;
    colors: { left: "#3b82f6"; center: "#84a98c"; right: "#ef4444" };
  };
  tone: "factual" | "neutral" | "opinionated" | "satirical";
  sentiment: { positive: number; neutral: number; negative: number; rationale: string };
  source_mix: string;
  reading_time_minutes: number;
  privacy_note: string;
  follow_up_questions: Array<{ q: string; a: string }> | string[];
}

interface GetArticleRequest { id: string }
interface GetArticleResponse { article: Article | null }

// ---------------- Helpers ----------------
const isArray = Array.isArray;
const isString = (v: unknown): v is string => typeof v === "string";

function ensureString(v: unknown, fallback = ""): string {
  return isString(v) ? v : (v == null ? fallback : String(v));
}
function ensureNum(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}
function ensureEnum<T extends string>(v: unknown, allowed: readonly T[], fallback: T): T {
  return (allowed as readonly string[]).includes(String(v)) ? (v as T) : fallback;
}
function safeParseArray<T>(raw: unknown): T[] {
  if (raw == null) return [];
  if (isArray(raw)) return raw as T[];
  if (isString(raw)) {
    try {
      const val = JSON.parse(raw);
      return isArray(val) ? (val as T[]) : [];
    } catch { return []; }
  }
  return [];
}

// --- normalize to 0..100 and sum==100 ---
function clamp01(n: number) { return Math.max(0, Math.min(100, Math.round(n))); }
function normalizeTriple(a: number, b: number, c: number): { A: number; B: number; C: number } {
  let A = clamp01(a), B = clamp01(b), C = clamp01(c);
  let sum = A + B + C;
  if (sum <= 0) return { A: 0, B: 100, C: 0 }; // prefer center if nothing
  if (sum !== 100) {
    const scale = 100 / sum;
    A = Math.round(A * scale);
    B = Math.round(B * scale);
    C = 100 - A - B;
    if (C < 0) {
      if (A >= B) A += C; else B += C;
      C = 0;
    }
  }
  return { A, B, C };
}

// Map analyzer tags -> UI tags (handles "number" vs "numbers")
function mapPointTag(tag: unknown): "fact" | "timeline" | "stakeholders" | "numbers" {
  const t = String(tag || "").toLowerCase();
  if (t === "number" || t === "numbers") return "numbers";
  if (t === "timeline") return "timeline";
  if (t === "stakeholder" || t === "stakeholders") return "stakeholders";
  return "fact";
}

// Build a perspective object from various analyzer shapes
function coercePerspective(p: any): { label: string; summary: string; bullets: string[] } {
  const label = ensureString(p?.label || p?.title, "Perspective");
  const bullets = safeParseArray<string>(p?.bullets).slice(0, 4);
  // If no explicit summary, derive one from the first bullet
  const summary = ensureString(p?.summary, bullets[0] || "");
  return { label, summary, bullets };
}

// ---------------- Endpoint ----------------
export const getArticle = api<GetArticleRequest, GetArticleResponse>(
  { expose: true, method: "GET", path: "/article/:id" },
  async ({ id }) => {
    const rows = await db.query/*sql*/`
      SELECT
        id, url, title, content,
        tldr_headline, tldr_subhead, tldr_paragraphs,
        eli5_summary, eli5_analogy,
        why_it_matters, key_points,
        bias_left, bias_center, bias_right, bias_confidence, bias_rationale,
        perspectives, common_ground, glossary,
        tone, sentiment_positive, sentiment_neutral, sentiment_negative, sentiment_rationale,
        source_mix, reading_time, domain, byline, published_at, follow_up_questions
      FROM articles
      WHERE id = ${id}
      LIMIT 1
    `;

    const rowsArray: any[] = [];
    for await (const row of rows) rowsArray.push(row);
    if (rowsArray.length === 0) return { article: null };

    const r: any = rowsArray[0] ?? {};

    // Parse JSON-ish columns safely
    const tldrParagraphs = safeParseArray<string>(r.tldr_paragraphs);
    const why = safeParseArray<string>(r.why_it_matters);
    const keyPointsRaw = safeParseArray<any>(r.key_points);
    const perspectivesRaw = safeParseArray<any>(r.perspectives);
    const common = safeParseArray<string>(r.common_ground);
    const glossaryRaw = safeParseArray<any>(r.glossary);
    const followupsRaw = safeParseArray<any>(r.follow_up_questions);

    // Follow-ups tolerate both older string[] and newer {q,a}[]
    const followups = followupsRaw
      .map((item: any) => {
        if (typeof item === "string") {
          return { q: item, a: "This question helps you think deeper about the article's implications and context." };
        }
        return {
          q: ensureString(item?.q || item?.question, ""),
          a: ensureString(item?.a || item?.answer, "This question helps you think deeper about the article's implications and context.")
        };
      })
      .filter((x: any) => x.q)
      .slice(0, 3);

    // Normalize bias & sentiment to sum 100
    const b = normalizeTriple(ensureNum(r.bias_left, 33), ensureNum(r.bias_center, 34), ensureNum(r.bias_right, 33));
    const s = normalizeTriple(ensureNum(r.sentiment_positive, 34), ensureNum(r.sentiment_neutral, 34), ensureNum(r.sentiment_negative, 32));

    // Build final Article
    const article: Article = {
      meta: {
        title: ensureString(r.title, "Untitled article"),
        domain: ensureString(r.domain, ""),
        byline: ensureString(r.byline, "Unknown"),
        published_at: ensureString(r.published_at, ""),
      },
      tldr: {
        headline: ensureString(r.tldr_headline, ""),
        subhead: ensureString(r.tldr_subhead, ""),
        paragraphs: tldrParagraphs.length > 0
          ? tldrParagraphs
          : [ensureString(r.tldr_headline, ""), ensureString(r.tldr_subhead, "")].filter(Boolean),
      },
      eli5: {
        summary: ensureString(r.eli5_summary, ""),
        ...(r.eli5_analogy ? { analogy: ensureString(r.eli5_analogy) } : {})
      },
      why_it_matters: why,

      key_points: keyPointsRaw
        .map((k: any) => ({
          text: ensureString(k?.text, ""),
          tag: mapPointTag(k?.tag),
        }))
        .filter(k => k.text),

      perspectives: perspectivesRaw.slice(0, 2).map(coercePerspective),

      common_ground: common,

      glossary: glossaryRaw
        .map((g: any) => ({
          term: ensureString(g?.term, ""),
          definition: ensureString(g?.definition, ""),
          link: g?.link ? ensureString(g.link) : undefined,
        }))
        .filter((g: any) => g.term && g.definition),

      bias: {
        left: b.A,
        center: b.B,
        right: b.C,
        confidence: ensureEnum(r.bias_confidence, ["low", "medium", "high"] as const, "medium"),
        rationale: ensureString(r.bias_rationale, ""),
        colors: { left: "#3b82f6", center: "#84a98c", right: "#ef4444" },
      },

      tone: ensureEnum(r.tone, ["factual", "neutral", "opinionated", "satirical"] as const, "factual"),

      sentiment: {
        positive: s.A,
        neutral: s.B,
        negative: s.C,
        rationale: ensureString(r.sentiment_rationale, ""),
      },

      source_mix: ensureString(r.source_mix, ""),
      reading_time_minutes: Math.max(1, Math.round(ensureNum(r.reading_time, 1))),
      privacy_note: "Auto-deletes after 24h",
      follow_up_questions: followups.length ? followups : [],
    };

    return { article };
  }
);
