// backend/news/fetch.ts
import axios from "axios";
import iconv from "iconv-lite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

export interface FetchArticleInput {
  url: string;
}

export interface FetchArticleResult {
  status: "ok" | "limited" | "error";
  url: string;
  site: string;
  title: string | null;
  byline: string | null;
  estReadMin: number;
  text: string; // CLEAN, plain text
  note?: string;
}

function decodeBody(buf: Buffer, contentType?: string): string {
  const m = /charset=([^;]+)/i.exec(contentType || "");
  const charset = (m?.[1] || "utf-8").toLowerCase();
  try {
    return iconv.decode(buf, charset);
  } catch {
    return buf.toString("utf-8");
  }
}

function estimateReadMinutes(text: string): number {
  const words = (text || "").trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200)); // ~200 wpm
}

function pick<T>(...vals: (T | null | undefined)[]): T | null {
  for (const v of vals) if (v != null && String(v).trim() !== "") return v as T;
  return null;
}

export async function fetchArticle({ url }: FetchArticleInput): Promise<FetchArticleResult> {
  const site = (() => {
    try { return new URL(url).hostname; } catch { return ""; }
  })();

  try {
    const res = await axios.get(url, {
      responseType: "arraybuffer",
      timeout: 15000,
      headers: {
        // Helps a LOT of sites allow scraping
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
          "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.8",
      },
      // Some sites need redirects and cookies
      maxRedirects: 5,
      withCredentials: false,
      validateStatus: s => s >= 200 && s < 400,
    });

    const html = decodeBody(Buffer.from(res.data), res.headers["content-type"]);
    const dom = new JSDOM(html, { url });
    const doc = dom.window.document;

    // Prefer OpenGraph/Twitter meta for title/byline fallback
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute("content") || null;
    const twTitle = doc.querySelector('meta[name="twitter:title"]')?.getAttribute("content") || null;
    const metaAuthor =
      doc.querySelector('meta[name="author"]')?.getAttribute("content") ||
      doc.querySelector('meta[property="article:author"]')?.getAttribute("content") ||
      null;

    // Readability extraction
    const reader = new Readability(doc);
    const article = reader.parse(); // may be null
    const title = pick<string>(article?.title, ogTitle, twTitle, doc.title || null);
    const byline = pick<string>(article?.byline, metaAuthor);

    // PRIMARY: use Readability textContent
    let text = (article?.textContent || "").trim();

    // FALLBACK: if Readability failed, grab <article> or paragraphs
    if (!text || text.split(/\s+/).length < 120) {
      // try <article> text
      const articleEl = doc.querySelector("article");
      const fallback1 = articleEl?.textContent?.trim() || "";
      if (fallback1.split(/\s+/).length > text.split(/\s+/).length) text = fallback1;

      // try concatenated paragraphs
      if (text.split(/\s+/).length < 120) {
        const paras = Array.from(doc.querySelectorAll("p"))
          .map(p => p.textContent?.trim() || "")
          .filter(Boolean)
          .join("\n\n");
        if (paras.split(/\s+/).length > text.split(/\s+/).length) text = paras;
      }
    }

    // If still too short, we call it "limited"
    const estReadMin = estimateReadMinutes(text);
    if (!text || text.split(/\s+/).length < 80) {
      return {
        status: "limited",
        url,
        site,
        title: title || null,
        byline: byline || null,
        estReadMin: Math.max(1, estReadMin),
        text: (text || "").trim(),
        note: "Extraction limited — article too short or behind paywall.",
      };
    }

    return {
      status: "ok",
      url,
      site,
      title: title || null,
      byline: byline || null,
      estReadMin: Math.max(1, estReadMin),
      text,
    };
  } catch (err: any) {
    return {
      status: "error",
      url,
      site,
      title: null,
      byline: null,
      estReadMin: 1,
      text: "",
      note: `Fetch failed: ${err?.message || String(err)}`,
    };
  }
}
