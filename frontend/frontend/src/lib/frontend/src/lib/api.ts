// PATH: frontend/src/lib/api.ts
import { fetchJson } from "./fetchJson";

// Read from env OR a browser override (localStorage) so you can test instantly.
function getApiBase(): string {
  const envBase =
    (import.meta as any)?.env?.VITE_API_BASE ||
    (process as any)?.env?.NEXT_PUBLIC_API_BASE ||
    "";
  if (typeof window !== "undefined") {
    const override = window.localStorage.getItem("API_BASE_OVERRIDE") || "";
    return (override || envBase).replace(/\/$/, "");
  }
  return envBase.replace(/\/$/, "");
}

export type ExplainResponse = {
  ok?: boolean;
  meta?: { status: 'full' | 'limited' | 'error'; url: string; site?: string | null; source?: string };
  header?: { title: string; byline: string | null; read_time_min: number | null; tone: string };
  [k: string]: any;
};

export async function explainNews(input: { url?: string; text?: string }) {
  const base = getApiBase();
  if (!base) {
    throw new Error("API base URL missing. Set VITE_API_BASE (or NEXT_PUBLIC_API_BASE) or use API_BASE_OVERRIDE on /settings.");
  }
  return fetchJson<ExplainResponse>(`${base}/api/news/analyze`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ url: input.url, pastedText: input.text }),
  });
}
