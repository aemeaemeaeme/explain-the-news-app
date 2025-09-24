// ===============================
// PATH: frontend/src/lib/api.ts
// Builds absolute backend URL from an env var so we never call /api on the website.
import { fetchJson } from "./fetchJson";

const API_BASE =
  // Vite env (you have vite.config.ts)
  (import.meta as any)?.env?.VITE_API_BASE ||
  // If you later run on Next, this also works:
  (process as any)?.env?.NEXT_PUBLIC_API_BASE ||
  "";

export type ExplainResponse = {
  ok: boolean;
  tl_dr?: string;
  key_points?: string[];
  bias?: number;
  sentiment?: "positive" | "neutral" | "negative";
  model?: string;
  error?: string;
};

export async function explainNews(input: { url?: string; text?: string }) {
  if (!API_BASE) {
    throw new Error("API base URL missing. Set VITE_API_BASE (or NEXT_PUBLIC_API_BASE) to your Leap backend origin.");
  }
  const base = API_BASE.replace(/\/$/, "");
  return fetchJson<ExplainResponse>(`${base}/api/news/explain`, {
    method: "POST",
    body: JSON.stringify(input ?? {}),
  });
}
