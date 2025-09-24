// PATH: frontend/pages/api-test.tsx
// WHY: Force calls to the real backend, never the website HTML.

import { useState } from "react";

// Read backend origin from env (must be set in hosting).
const API_BASE =
  (import.meta as any)?.env?.VITE_API_BASE ||
  (process as any)?.env?.NEXT_PUBLIC_API_BASE ||
  "";

const API_URL = API_BASE ? `${API_BASE.replace(/\/$/, "")}/api/news/analyze` : "";

export default function ApiTest() {
  const [articleUrl, setArticleUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  async function send() {
    setErr(""); setOut(""); setLoading(true);
    try {
      if (!API_URL) throw new Error("VITE_API_BASE (or NEXT_PUBLIC_API_BASE) is not set to your backend origin.");
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          url: articleUrl || undefined,
          pastedText: articleText || undefined, // backend expects pastedText
        }),
      });

      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = (await res.text()).slice(0, 200);
        throw new Error(`Non-JSON from ${API_URL}. Likely hit the frontend. Snippet: ${snippet}`);
      }

      const data = await res.json();
      if (!res.ok) {
        const msg = (data as any)?.error || (data as any)?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      }

      setOut(JSON.stringify(data, null, 2));
    } catch (e: any) {
      setErr(e?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 760, margin: "40px auto", padding: 16, fontFamily: "system-ui, sans-serif" }}>
      <h1>API Test</h1>
      <p>Paste a news URL (or text) and click Send.</p>

      <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>Article URL</label>
      <input
        value={articleUrl}
        onChange={(e) => setArticleUrl(e.target.value)}
        placeholder="https://example.com/news-article"
        style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
      />

      <label style={{ display: "block", marginTop: 12, fontWeight: 600 }}>OR Article Text</label>
      <textarea
        value={articleText}
        onChange={(e) => setArticleText(e.target.value)}
        placeholder="Paste article text (optional)"
        rows={6}
        style={{ width: "100%", padding: 8, border: "1px solid #ccc", borderRadius: 8 }}
      />

      <button onClick={send} disabled={loading} style={{ marginTop: 14, padding: "10px 16px", borderRadius: 10 }}>
        {loading ? "Sending…" : "Send"}
      </button>

      {API_BASE ? null : (
        <p style={{ marginTop: 10, color: "#b45309" }}>
          Tip: set <code>VITE_API_BASE</code> to your backend origin (e.g. https://xxxxx.lp.dev) and redeploy.
        </p>
      )}

      {err && <pre style={{ marginTop: 16, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>}
      {out && <pre style={{ marginTop: 16, background: "#f6f8fa", padding: 12, borderRadius: 8, overflowX: "auto" }}>{out}</pre>}
    </div>
  );
}
