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
