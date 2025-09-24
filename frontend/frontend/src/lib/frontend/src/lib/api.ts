/* ===========================================
FILE: frontend/src/lib/api.ts
WHY: Fixes backend path and sends required payload
=========================================== */

import { fetchJson } from "./fetchJson";

const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (process as any)?.env?.NEXT_PUBLIC_API_BASE ||
  "";

export type ExplainResponse = {
  ok?: boolean;
  meta?: { status: "full" | "limited" | "error"; url: string; site?: string | null; source?: string };
  header?: { title: string; byline: string | null; read_time_min: number | null; tone: string };
  [k: string]: any;
};

/**
 * Calls backend /analyze endpoint with all required fields
 */
export async function explainNews(input: { url?: string; text?: string }) {
  if (!API_BASE) {
    throw new Error("API base URL missing. Set VITE_API_BASE (or NEXT_PUBLIC_API_BASE) to your backend origin.");
  }
  const base = API_BASE.replace(/\/$/, "");

  // Build required payload
  const payload = {
    url: input.url || "pasted-article",
    site: input.url ? new URL(input.url).hostname : "pasted",
    title: input.text ? "Pasted Article" : "Fetched Article",
    byline: null,
    estReadMin: 3, // default until we calculate properly
    text: input.text || "Placeholder article text (scraper integration needed)"
  };

  return fetchJson<ExplainResponse>(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
}
