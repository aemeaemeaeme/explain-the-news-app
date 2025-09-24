// PATH: frontend/pages/api/news/explain.ts
// Why: This file turns /api/news/explain into a real API endpoint that always returns JSON.
// Works immediately with a mock response. Optional: set BACKEND_URL or OPENAI_API_KEY for real processing.

import type { NextApiRequest, NextApiResponse } from "next";

// ---- Types
type ExplainResponse = {
  ok: boolean;
  tl_dr?: string;
  key_points?: string[];
  bias?: number; // 0..1 (0 = neutral)
  sentiment?: "positive" | "neutral" | "negative";
  model?: string;
  error?: string;
};

// ---- Main handler
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    // CORS (so your hosted frontend can call this no matter what)
    if (req.method === "OPTIONS") {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "content-type, authorization");
      return res.status(204).end();
    }

    if (req.method !== "POST") {
      return json(res, { ok: false, error: "Method Not Allowed" }, 405);
    }

    // Parse body safely
    const input = typeof req.body === "string" ? safeParse(req.body) : (req.body || {});
    const articleInput = String(input?.text || input?.url || "").slice(0, 8000);

    // 1) If you have a separate backend, set BACKEND_URL in your env (no trailing slash).
    const backend = process.env.BACKEND_URL;
    if (backend) {
      const r = await fetch(`${backend}/api/news/explain`, {
        method: "POST",
        headers: { "content-type": "application/json", accept: "application/json" },
        body: JSON.stringify({ url: input?.url, text: input?.text }),
      });

      const ct = r.headers.get("content-type") || "";
      if (!ct.includes("application/json")) {
        const snippet = await r.text();
        return json(
          res,
          { ok: false, error: `Upstream non-JSON from backend. Snippet: ${snippet.slice(0, 160)}` },
          502
        );
      }
      const data = (await r.json()) as ExplainResponse;
      return json(res, data, r.status);
    }

    // 2) If you set OPENAI_API_KEY, we’ll summarize directly.
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey) {
      const out = await summarizeWithOpenAI(apiKey, articleInput);
      return json(res, out, 200);
    }

    // 3) Fallback: mock so the UI works right now.
    return json(
      res,
      {
        ok: true,
        tl_dr: "Quick summary of the article.",
        key_points: ["Main point one", "Main point two", "Main point three"],
        bias: 0.15,
        sentiment: "neutral",
        model: "mock",
      },
      200
    );
  } catch (e: any) {
    return json(res, { ok: false, error: e?.message || "Server error" }, 500);
  }
}

// ---- helpers
function json(res: NextApiResponse, body: ExplainResponse, status = 200) {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.status(status).json(body);
}

function safeParse(t: string) {
  try {
    return JSON.parse(t || "{}");
  } catch {
    return {};
  }
}

async function summarizeWithOpenAI(apiKey: string, content: string): Promise<ExplainResponse> {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Return a JSON object only." },
        {
          role: "user",
          content:
            `Summarize news content. Return fields: tl_dr, key_points[], bias (0..1), sentiment (positive|neutral|negative).\nContent:\n${content}`,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    }),
  });

  const ct = r.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    return { ok: false, error: `OpenAI non-JSON: ${ct}`, model: "openai" };
  }

  const data = await r.json();
  const raw = data?.choices?.[0]?.message?.content || "{}";
  let parsed: any = {};
  try { parsed = JSON.parse(raw); } catch {}

  return {
    ok: true,
    tl_dr: parsed?.tl_dr || parsed?.tldr || "Summary unavailable",
    key_points: parsed?.key_points || parsed?.bullets || [],
    bias: Number(parsed?.bias ?? 0.2),
    sentiment: parsed?.sentiment || "neutral",
    model: "openai",
  };
}
