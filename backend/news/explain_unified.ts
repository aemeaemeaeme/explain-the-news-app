// backend/news/explain_unified.ts
import { api } from "encore.dev/api";
import { getConfigSummary } from "./config";
import { fetchArticle } from "./fetch"; // our fetch endpoint function
import { analyzeWithLLM } from "./llm_router";

type ExplainRequest = {
  url?: string;
  pastedText?: string;
};

type ExplainResponse = import("./llm_router").UnifiedAnalysisResponse;

export const explain = api<ExplainRequest, ExplainResponse>(
  { expose: true, method: "POST", path: "/explain" },
  async ({ url, pastedText }) => {
    console.log("🧭 /news/explain called", { hasUrl: !!url, hasText: !!pastedText });
    console.log("ℹ️  CONFIG:", getConfigSummary());

    if (!url && !pastedText) {
      return {
        meta: {
          provider: "gemini",
          model: "error",
          elapsed_ms: 0,
          site: "",
          url: "",
          status: "error",
        },
        header: {
          title: "No input provided",
          byline: null,
          read_time_min: null,
          tone: "unknown",
        },
        tldr: "Please provide a URL or paste the article text.",
        eli5: "I need either a link to the article or the article text to analyze.",
        why_it_matters: [],
        key_points: [],
        bias: { left_pct: 0, center_pct: 100, right_pct: 0, confidence: "low", note: "No data" },
        sentiment: { positive_pct: 0, neutral_pct: 100, negative_pct: 0, note: "No data" },
        perspectives: { left_view: [], center_view: [], right_view: [] },
        common_ground: [],
        glossary: [],
        errors: [{ code: "no_input", message: "Provide url or pastedText" }],
      };
    }

    try {
      // Branch: pasted text (no fetching)
      if (pastedText && pastedText.trim().length > 0) {
        const clean = pastedText.trim();
        const title = (url ?? "").toString() || "User-provided text";
        const res = await analyzeWithLLM(clean, url ?? "", title, /* limited */ false);
        return res;
      }

      // Branch: fetch from URL then analyze
      if (url) {
        const fetched = await fetchArticle({ url });
        const isLimited = fetched.status === "limited";
        const articleText = fetched.text || "";
        const title = fetched.title || "Untitled";
        const res = await analyzeWithLLM(articleText, url, title, isLimited);
        return res;
      }

      // Should never reach here
      throw new Error("unreachable");

    } catch (err: any) {
      const msg = err?.message || String(err);
      console.error("❌ /news/explain failed:", msg);
      return {
        meta: {
          provider: "gemini",
          model: "error",
          elapsed_ms: 0,
          site: url ? new URL(url).hostname : "",
          url: url ?? "",
          status: "error",
        },
        header: {
          title: "Analysis Failed",
          byline: null,
          read_time_min: null,
          tone: "unknown",
        },
        tldr: "We couldn’t analyze this article right now.",
        eli5: "Something went wrong while fetching or summarizing. Please try a different link or paste the text.",
        why_it_matters: [],
        key_points: [],
        bias: { left_pct: 0, center_pct: 100, right_pct: 0, confidence: "low", note: "Error path" },
        sentiment: { positive_pct: 0, neutral_pct: 100, negative_pct: 0, note: "Error path" },
        perspectives: { left_view: [], center_view: [], right_view: [] },
        common_ground: [],
        glossary: [],
        errors: [{ code: "explain_error", message: msg }],
      };
    }
  }
);
