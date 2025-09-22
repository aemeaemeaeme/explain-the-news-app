// backend/news/fetch.ts
import { api } from "encore.dev/api";
import axios from "axios";
import * as iconv from "iconv-lite";
import { JSDOM } from "jsdom";
import { Readability } from "@mozilla/readability";

/** === Types stay the same so the rest of your app doesn't break === */
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

  // From Content-Type header
  if (contentType) {
    const m = /charset=([^;]+)/i.exec(contentType);
    if (m?.[1]) charset = m[1].trim().toLowerCase();
  }

  // From <meta charset> if needed
  if (!contentType && htmlSample) {
    const m = /<meta[^>]+charset=["']?([^"'>\s]+)/i.exec(htmlSample);
    if (m?.[1]) charset = m[1].trim().toLowerCase();
  }

  try {
    return iconv.decode(Buffer.from(data), charset);
  } catch {
    // last resort
    return Buffer.from(data).toString("utf8");
  }
}

/** Axios fetch with robust headers, redirects and decompression */
async function httpGetHtml(url: string, timeoutMs = 15000) {
  const res = await axios.get<ArrayBuffer>(url, {
    responseType: "arraybuffer",
    timeout: timeoutMs,
    maxRedirects: 5,
    decompress: true,
    validateStatus: s => s >= 200 && s < 400, // follow 3xx; treat others as error
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
  return { html, finalUrl: (res as any).request?.res?.responseUrl ?? url };
}

async function fetchWithRetries(url: string, retries = 2): Promise<{ html: string; finalUrl: string }> {
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

/** ---- Metadata helpers (kept close to your originals) ---- */
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

  // article.content is sanitized HTML; article.textContent is already plain text
  return {
    content: article.content || "",
    textContent: (article.textContent || "").trim(),
  };
}

/** Light regex fallback (your original helper, simplified) */
function simpleReadability(html: string) {
  const noJunk = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "");

  const candidates = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content
