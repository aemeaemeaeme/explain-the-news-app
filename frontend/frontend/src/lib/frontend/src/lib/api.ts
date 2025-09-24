/* ===========================================
FILE: frontend/src/lib/api.ts
Fixes backend path + sends required payload
=========================================== */

import { fetchJson } from "./fetchJson";

const API_BASE = "https://staging-explain-the-news-app-8mc2.encr.app";

export type ExplainResponse = {
  ok?: boolean;
  meta?: { status: "full" | "limited" | "error"; url: string; site?: string | null; source?: string };
  header?: { title: string; byline: string | null; read_time_min: number | null; tone: string };
  [k: string]: any;
};

console.log("DEBUG: VITE_API_BASE =", API_BASE);

export async function explainNews(input: { url?: string; text?: string }) {
  if (!API_BASE) {
    throw new Error("API base URL missing. Set VITE_API_BASE (or NEXT_PUBLIC_API_BASE).");
  }
  const base = API_BASE.replace(/\/$/, "");

  // Build payload for backend
  const payload = {
    url: input.url || "pasted-article",
    site: input.url ? new URL(input.url).hostname : "pasted",
    title: input.text ? "Pasted Article" : "Fetched Article",
    byline: null,
    estReadMin: 3,
    text: input.text || "Placeholder article text"
  };

  return fetchJson<ExplainResponse>(`${base}/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(payload),
  });
}
