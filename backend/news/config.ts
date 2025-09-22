// backend/news/fetch.ts
import { api } from "encore.dev/api";
import axios from "axios";
import * as iconv from "iconv-lite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";
import { CONFIG } from "./config";
import { FIRECRAWL_API_KEY } from "./config";

/** === Types (unchanged) === */
interface FetchArticleRequest {
  url: string;
}

interface FetchArticleResponse {
  status: "ok" | "limited";
  title: string;
  byline: string | null;
  content: string; // raw-ish HTML or text used for model input
  text: string;    // clean plain text
  site: string;
  estReadMin: number;
  reason?: string;
}

/** --- User agents & helpers --- */
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
];
const pickUA = () => USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Detect charset from headers/meta and decode bytes to string */
function decodeBody(data: ArrayBuffer, contentType?: string, htmlSample?: string): string {
  let charset = "utf-8";
  if (contentType) {
    const m = /charset=([^;]+)/i.exec(contentType);
    if (m?.[1]) charset = m[1].trim().toLowerCase();
  }
  if (!contentType && htmlSample) {
    const m = /<meta[^>]+charset=["']?([^"'>\s]+)/i.exec(htmlSample);
    if (m?.[1]) charset = m[1].trim().toLowerCase();
  }
  try {
    return iconv.decode(Buffer.from(data), charset);
  } catch {
    return Buffer.from(data).toString("utf8");
  }
}

/** Axios fetch with robust headers, redirects and decompression */
async function httpGetHtml(url: string, timeoutMs = CONFIG.EXTRACTION_TIMEOUT_MS) {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
    timeout: timeoutMs,
    maxRedirects: 5,
    decompress: true,
    validateStatus: s => s >= 200 && s < 400,
    headers: {
      "User-Agent": pickUA(),
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "Pragma": "no-cache",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Upgrade-Insecure-Requests": "1",
    },
  });

  const html = decodeBody(res.data, res.headers["content-type"]);
  return { html, finalUrl: (res.request as any)?.res?.responseUrl ?? url };
}

async function fetchWithRetries(url: string, retries = CONFIG.EXTRACTION_RETRIES): Promise<{ html: string; finalUrl: string }> {
  let lastErr: any;
  for (let i = 0; i <= retries; i++) {
    try {
      return await httpGetHtml(url);
    } catch (e) {
      lastErr = e;
      if (i < retries) await sleep(500 + Math.random() * 800);
    }
  }
  throw lastErr;
}

/** ---- Metadata helpers ---- */
function extractMetadata(html: string, url: string) {
  const domain = new URL(url).hostname.replace(/^www\./, "");
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);

  let title = ogTitleMatch?.[1] || h1Match?.[1] || titleMatch?.[1] || "Untitled Article";
  title = title.replace(/<[^>]+>/g, "").trim().replace(/\s+/g, " ");

  const bylinePatterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<p[^>]*class="[^"]*byline[^"]*"[^>]*>([^<]+)<\/p>/i,
    /<div[^>]*class="[^"]*byline[^"]*"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/i,
    /By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /<address[^>]*>.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+).*?<\/address>/i,
  ];

  let byline: string | null = null;
  for (const rx of bylinePatterns) {
    const m = html.match(rx);
    if (m?.[1]) {
      const val = m[1].replace(/<[^>]+>/g, "").trim().replace(/^By\s+/i, "");
      if (val.length > 3 && val.length < 100) { byline = val; break; }
    }
  }
  return { title, byline, domain };
}

/** Strong default parser: JSDOM + Readability */
function parseWithReadability(html: string, url: string) {
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();
  if (!article) return { content: "", textContent: "" };
  return {
    content: article.content || "",
    textContent: (article.textContent || "").trim(),
  };
}

/** Light regex fallback */
function simpleReadability(html: string) {
  const noJunk = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const candidates = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  let content = "";
  for (const rx of candidates) {
    const m = noJunk.match(rx);
    if (m?.[1] && m[1].length > 400) { content = m[1]; break; }
  }
  if (!content) content = noJunk;

  const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { content, textContent };
}

/** AMP helpers, JSON-LD, OG */
function findAmpUrls(html: string, baseUrl: string): string[] {
  const out: string[] = [];
  const relAmp = html.match(/<link[^>]*rel=["']amphtml["'][^>]*href=["']([^"']+)["']/i)?.[1];
  if (relAmp) out.push(new URL(relAmp, baseUrl).href);

  const u = new URL(baseUrl);
  const variants = [
    `${u.origin}${u.pathname.replace(/\/$/, "")}/amp`,
    `${u.origin}${u.pathname.replace(/\/$/, "")}/amp.html`,
    `${u.origin}${u.pathname.replace(/\/$/, "")}?amp=1`,
    `${u.origin}/amp${u.pathname}`,
  ];
  for (const v of variants) if (!out.includes(v)) out.push(v);
  return out;
}

function extractJsonLd(html: string): string {
  const tags = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  if (!tags) return "";
  for (const t of tags) {
    try {
      const json = t.replace(/^<script[^>]*>/i, "").replace(/<\/script>$/i, "");
      const data = JSON.parse(json);
      const arr = Array.isArray(data) ? data : [data];
      for (const item of arr) {
        if (item["@type"] === "NewsArticle" || item["@type"] === "Article") {
          if (typeof item.articleBody === "string") return item.articleBody;
          if (typeof item.text === "string") return item.text;
          if (Array.isArray(item.paragraph)) return item.paragraph.join("\n\n");
        }
      }
    } catch {}
  }
  return "";
}

function extractOpenGraphContent(html: string): string {
  const ogDesc = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const desc = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i)?.[1];
  const firstParas = (html.match(/<p[^>]*>([\s\S]*?)<\/p>/gi) || [])
    .slice(0, 6)
    .map(p => p.replace(/<[^>]+>/g, "").trim())
    .filter(p => p.length > 20)
    .join("\n\n");

  return [ogDesc, desc, firstParas].filter(Boolean).join("\n\n").trim();
}

/** Domain adapters (fallbacks) */
function getDomainAdapter(domain: string) {
  const adapters: Record<string, (html: string) => { content: string; textContent: string }> = {
    "cnn.com": (html) => {
      const matches = html.match(/<div[^>]*class="[^"]*zn-body__paragraph[^"]*"[^>]*>([\s\S]*?)<\/div>/gi);
      if (matches && matches.length > 3) {
        const content = matches.join("\n");
        const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 500) return { content, textContent };
      }
      return simpleReadability(html);
    },
    "reuters.com": (html) => {
      const matches = html.match(/<p[^>]*data-testid=["']paragraph-\d+["'][^>]*>([\s\S]*?)<\/p>/gi);
      if (matches && matches.length > 2) {
        const content = matches.join("\n");
        const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 500) return { content, textContent };
      }
      return simpleReadability(html);
    },
    "apnews.com": (html) => {
      const m = html.match(/<div[^>]*class="[^"]*RichTextStoryBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (m?.[1]) {
        const content = m[1];
        const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 500) return { content, textContent };
      }
      return simpleReadability(html);
    },
    "foxnews.com": (html) => {
      const blocks =
        html.match(/<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/gi) ||
        html.match(/<p[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/p>/gi);
      if (blocks && blocks.length > 3) {
        const content = Array.isArray(blocks) ? blocks.join("\n") : String(blocks);
        const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 500) return { content, textContent };
      }
      return simpleReadability(html);
    },
    "politico.com": (html) => {
      const m = html.match(/<div[^>]*class="[^"]*(?:story-text|article-content|content-group)[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (m?.[1]) {
        const content = m[1];
        const textContent = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (textContent.length > 600) return { content, textContent };
      }
      return simpleReadability(html);
    },
  };
  return adapters[domain] || simpleReadability;
}

/** === Firecrawl (first attempt) === */
async function tryFirecrawl(url: string) {
  const key = FIRECRAWL_API_KEY?.();
  if (!key) return null;

  try {
    const res = await axios.post(
      "https://api.firecrawl.dev/v1/scrape",
      {
        url,
        // ask for markdown & html so we have options; Firecrawl may also return metadata
        formats: ["markdown", "html"],
      },
      {
        timeout: CONFIG.EXTRACTION_TIMEOUT_MS,
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          "User-Agent": pickUA(),
        },
        validateStatus: s => s >= 200 && s < 500,
      }
    );

    if (res.status >= 400) {
      console.log(`🔥 Firecrawl responded ${res.status}: ${res.data?.error || res.statusText}`);
      return null;
    }

    const data = res.data || {};
    const md: string = data.markdown || data.content || "";
    const html: string = data.html || "";
    const meta = data.metadata || {};
    const text = (md || html || "").replace(/<\/?[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    if (text.length >= CONFIG.EXTRACTION_MIN_CHARS) {
      const domain = new URL(url).hostname.replace(/^www\./, "");
      const title = (meta.title || "").toString().trim() || "Untitled Article";
      const byline =
        (meta.author?.toString().trim?.() ||
          meta.byline?.toString().trim?.() ||
          null) as string | null;

      const est = Math.max(1, Math.round(text.split(/\s+/).length / 225));
      return {
        status: "ok" as const,
        title,
        byline,
        content: html || md,
        text: md ? md : text,
        site: domain,
        estReadMin: est,
      };
    }

    return null;
  } catch (e) {
    console.log("🔥 Firecrawl request failed:", e);
    return null;
  }
}

/** === Main Encore API === */
export const fetchArticle = api<FetchArticleRequest, FetchArticleResponse>(
  { expose: true, method: "POST", path: "/fetch" },
  async ({ url }) => {
    console.log(`🔍 Starting extraction for: ${url}`);
    try { new URL(url); } catch { throw new Error("Invalid URL provided"); }

    // 0) Firecrawl first (if key configured)
    try {
      const fc = await tryFirecrawl(url);
      if (fc) {
        console.log(`✅ Firecrawl success (${fc.text.length} chars)`);
        return fc;
      }
    } catch {
      // continue to native pipeline
    }

    try {
      // 1) Native fetch + Readability
      const { html, finalUrl } = await fetchWithRetries(url);
      const { title, byline, domain } = extractMetadata(html, finalUrl);

      let parsed = parseWithReadability(html, finalUrl);
      if (parsed.textContent && parsed.textContent.length >= CONFIG.EXTRACTION_MIN_CHARS) {
        console.log(`✅ Readability success: ${parsed.textContent.length} chars`);
        const est = Math.max(1, Math.round(parsed.textContent.split(/\s+/).length / 225));
        return { status: "ok", title, byline, content: parsed.content, text: parsed.textContent, site: domain, estReadMin: est };
      }

      // 2) Domain adapter
      const adapter = getDomainAdapter(domain);
      parsed = adapter(html);
      if (parsed.textContent && parsed.textContent.length >= CONFIG.EXTRACTION_MIN_CHARS) {
        console.log(`✅ Domain adapter success: ${parsed.textContent.length} chars`);
        const est = Math.max(1, Math.round(parsed.textContent.split(/\s+/).length / 225));
        return { status: "ok", title, byline, content: parsed.content, text: parsed.textContent, site: domain, estReadMin: est };
      }

      // 3) AMP
      for (const ampUrl of findAmpUrls(html, finalUrl)) {
        try {
          const { html: ampHtml } = await fetchWithRetries(ampUrl, 1);
          const ampParsed = parseWithReadability(ampHtml, ampUrl);
          if (ampParsed.textContent.length >= CONFIG.EXTRACTION_MIN_CHARS - 100) {
            console.log(`✅ AMP success: ${ampParsed.textContent.length} chars`);
            const est = Math.max(1, Math.round(ampParsed.textContent.split(/\s+/).length / 225));
            return { status: "ok", title, byline, content: ampParsed.content, text: ampParsed.textContent, site: domain, estReadMin: est };
          }
        } catch (e) {
          console.log("AMP fetch failed:", e);
        }
      }

      // 4) JSON-LD body
      const jsonLd = extractJsonLd(html);
      if (jsonLd && jsonLd.length >= CONFIG.EXTRACTION_MIN_CHARS - 100) {
        console.log(`✅ JSON-LD success: ${jsonLd.length} chars`);
        const est = Math.max(1, Math.round(jsonLd.split(/\s+/).length / 225));
        return { status: "ok", title, byline, content: jsonLd, text: jsonLd, site: domain, estReadMin: est };
      }

      // 5) OG/Description fallback (limited)
      const og = extractOpenGraphContent(html);
      if (og && og.length >= 300) {
        console.log(`⚠️ Limited content via OG/desc: ${og.length} chars`);
        const est = Math.max(1, Math.round(og.split(/\s+/).length / 225));
        return { status: "limited", title, byline, content: og, text: og, site: domain, estReadMin: est, reason: "limited_content" };
      }

      // 6) Total fallback
      console.log("❌ Extraction fell through all strategies");
      const msg = `Content extraction limited for ${domain}. ${title}`;
      return { status: "limited", title, byline, content: msg, text: msg, site: domain, estReadMin: 1, reason: "site_protection" };

    } catch (err) {
      console.error("💥 Extraction error:", err);
      const d = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "unknown"; }})();
      const msg = `Failed to extract content from ${d}. This site may have strong anti-bot protection or blocked our request.`;
      return { status: "limited", title: "Content Extraction Failed", byline: null, content: msg, text: msg, site: d, estReadMin: 1, reason: "extraction_failed" };
    }
  }
);
