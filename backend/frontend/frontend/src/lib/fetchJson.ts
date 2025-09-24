// ===============================
// PATH: frontend/src/lib/fetchJson.ts
// Blocks HTML (website) responses so we know if we hit the frontend by mistake.
export async function fetchJson<T>(url: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { Accept: "application/json", "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    const snippet = await res.text();
    throw new Error(`Expected JSON, got: ${ct}. Likely hit the frontend. Snippet: ${snippet.slice(0, 160)}`);
  }
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try { const j = await res.json(); msg = j?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json() as Promise<T>;
}

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
