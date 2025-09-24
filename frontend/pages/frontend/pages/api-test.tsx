import { useState } from "react";

export default function ApiTest() {
  const [articleUrl, setArticleUrl] = useState("");
  const [articleText, setArticleText] = useState("");
  const [loading, setLoading] = useState(false);
  const [out, setOut] = useState("");
  const [err, setErr] = useState("");

  async function send() {
    setErr(""); setOut(""); setLoading(true);
    try {
      const res = await fetch("/api/news/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          url: articleUrl || undefined,
          text: articleText || undefined,
        }),
      });
      const ct = res.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = await res.text();
        throw new Error(`Expected JSON, got: ${ct}. Snippet: ${snippet.slice(0, 180)}`);
      }
      const data = await res.json();
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

      {err && <pre style={{ marginTop: 16, color: "crimson", whiteSpace: "pre-wrap" }}>{err}</pre>}
      {out && <pre style={{ marginTop: 16, background: "#f6f8fa", padding: 12, borderRadius: 8, overflowX: "auto" }}>{out}</pre>}
    </div>
  );
}
