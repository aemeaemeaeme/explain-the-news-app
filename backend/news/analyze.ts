// backend/news/analyze.ts
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { url, pastedText } = req.body;

    // Step 1: Ignore input for now — just return Hello World
    return res.status(200).json({
      ok: true,
      meta: { status: "full", url: url || "no-url-provided" },
      header: { title: "Hello World", byline: null, read_time_min: 1, tone: "neutral" },
      tldr: "This is just a test response to confirm frontend ↔ backend works.",
    });
  } catch (err: any) {
    console.error("Analyze error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
