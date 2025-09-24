// backend/news/explain_unified.ts
import { api } from "encore.dev/api";
import { fetchArticle } from "./fetch";
import { analyzeWithLLM, type UnifiedAnalysisResponse } from "./llm_router";

export interface ExplainRequest { url?: string; pastedText?: string; }
export interface ExplainResponse extends UnifiedAnalysisResponse {}

export const explain = api<ExplainRequest, ExplainResponse>(
  { expose: true, method: "POST", path: "/explain" },
  async ({ url, pastedText }) => {
    if (!url && !pastedText) {
      return {
        meta: { provider: "openai", model: "none", elapsed_ms: 0, site: "", url: "", status: "error" },
        header: { title: "No input", byline: null, read_time_min: null, tone: "unknown" },
        tldr: "Provide a URL or paste the article text.",
      } as ExplainResponse;
    }

    // If pasted text: go straight to LLM
    if (pastedText && pastedText.trim()) {
      return analyzeWithLLM(pastedText.trim(), url || "", url || "User Text", /*isLimited*/ false);
    }

    // URL flow
    const got = await fetchArticle({ url: String(url) });
    const limited = got.status !== "ok";
    const clean = got.text || "";
    const title = got.title || "Untitled";
    const res = await analyzeWithLLM(clean, String(url), title, limited);

    // Fill header meta if LLM left them blank
    res.header = {
      title: res.header?.title || title,
      byline: res.header?.byline ?? (got.byline || null),
      read_time_min: res.header?.read_time_min ?? got.estReadMin,
      tone: res.header?.tone || "neutral",
    };
    res.meta = {
      ...res.meta,
      site: res.meta?.site || got.site,
      url: String(url),
      status: limited ? "limited" : "ok",
    };

    return res;
  }
);
