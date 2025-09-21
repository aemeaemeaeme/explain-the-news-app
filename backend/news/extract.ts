import { api } from "encore.dev/api";

interface ExtractRequest {
  url: string;
}

interface ExtractResponse {
  status: "ok" | "limited";
  site: string;
  url: string;
  title: string;
  byline: string | null;
  estReadMin: number;
  html?: string;
  text: string;
  reason?: string;
}

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function okText(s?: string): boolean { 
  return !!(s && s.replace(/\s+/g, " ").length > 1200);
}

async function fetchWithTimeout(target: string, timeoutMs = 30000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(target, {
      headers: { 
        "user-agent": UA, 
        "accept-language": "en-US,en;q=0.9",
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "cache-control": "no-cache"
      }, 
      redirect: "follow",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// Simple DOM-like parsing for server-side use
function parseHtmlLike(html: string) {
  return {
    querySelector: (selector: string) => {
      if (selector === 'title') {
        const match = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        return match ? { textContent: match[1] } : null;
      }
      return null;
    },
    querySelectorAll: (selector: string) => {
      if (selector === 'p') {
        const matches = html.match(/<p[^>]*>.*?<\/p>/gi) || [];
        return matches.map(p => ({ 
          textContent: p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
        }));
      }
      return [];
    }
  };
}

// Simple Readability-like implementation
function readabilityExtract(html: string, url: string) {
  // Remove scripts, styles, and other non-content elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share|newsletter|subscribe)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Extract title
  const titleMatch = cleaned.match(/<title[^>]*>([^<]*)<\/title>/i) ||
                    cleaned.match(/<h1[^>]*>([^<]*)<\/h1>/i) ||
                    cleaned.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i);
  let title = titleMatch ? titleMatch[1].trim() : 'Untitled Article';
  title = title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");

  // Extract byline
  const bylinePatterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i,
    /<span[^>]*class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]*)<\/span>/i,
    /<p[^>]*class="[^"]*byline[^"]*"[^>]*>(?:By\s+)?([^<]*)<\/p>/i,
    /By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
  ];
  
  let byline = null;
  for (const pattern of bylinePatterns) {
    const match = cleaned.match(pattern);
    if (match && match[1]) {
      byline = match[1].trim().replace(/^By\s+/i, '').replace(/\s+/g, ' ');
      if (byline.length > 3 && byline.length < 100) break;
    }
  }

  // Try to find main content areas
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content|article-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*id="[^"]*(?:article|story|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:article|story|content)[^"]*"[^>]*>([\s\S]*?)<\/section>/i
  ];

  let content = cleaned;
  for (const selector of contentSelectors) {
    const match = cleaned.match(selector);
    if (match && match[1] && match[1].length > 800) {
      content = match[1];
      break;
    }
  }

  // Extract meaningful paragraphs
  const paragraphs = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi) || [];
  const cleanParagraphs = paragraphs
    .map(p => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 40 && !p.match(/^(subscribe|follow|share|click|advertisement)/i))
    .join('\n\n');

  let textContent;
  if (cleanParagraphs.length > 600) {
    textContent = cleanParagraphs;
  } else {
    // Fallback: strip all HTML
    textContent = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return {
    site: new URL(url).hostname,
    url: url,
    title: title || 'Untitled Article',
    byline: byline || null,
    estReadMin: Math.max(1, Math.round((textContent.split(/\s+/).length) / 225)),
    html: content || "",
    text: textContent || ""
  };
}

async function tryReadability(target: string) {
  try {
    const r = await fetchWithTimeout(target);
    if (!r.ok) return null;
    const html = await r.text();
    const result = readabilityExtract(html, target);
    if (!result?.text) return null;
    return result;
  } catch (error) {
    console.log(`Readability extraction failed for ${target}:`, error);
    return null;
  }
}

async function resolveAmp(u: string) {
  try {
    const r = await fetchWithTimeout(u, 15000);
    const html = await r.text();
    const m = html.match(/<link[^>]+rel=["']amphtml["'][^>]+href=["']([^"']+)["']/i);
    if (m) return new URL(m[1], r.url).toString();
  } catch (error) {
    console.log('AMP resolution failed:', error);
  }
  return null;
}

// OPTIONAL: implement Playwright fallback only if your host supports it
async function tryHeadless(u: string): Promise<{
  site: string;
  url: string;
  title: string;
  byline: string | null;
  estReadMin: number;
  html: string;
  text: string;
} | null> {
  try {
    // Check if playwright is available (comment this out if not installed)
    // const { chromium } = await import("playwright");
    // const browser = await chromium.launch({ args: ["--no-sandbox"], headless: true });
    // const page = await browser.newPage({ userAgent: UA, locale: "en-US" });
    // await page.goto(u, { waitUntil: "domcontentloaded", timeout: 30000 });
    // 
    // // Basic consent dismissors (best-effort)
    // try { await page.click('button:has-text("Accept")', { timeout: 3000 }); } catch {}
    // try { await page.click('button:has-text("Allow")', { timeout: 3000 }); } catch {}
    // 
    // const content = await page.content();
    // await browser.close();
    // 
    // const result = readabilityExtract(content, u);
    // if (!result?.text) return null;
    // return result;
    
    // For now, return null since playwright might not be available
    console.log('Headless browser extraction not available');
    return null;
  } catch (error) {
    console.log('Headless extraction failed:', error);
    return null;
  }
}

export const extract = api<ExtractRequest, ExtractResponse>(
  { expose: true, method: "GET", path: "/extract" },
  async ({ url }) => {
    console.log(`🔍 Starting robust extraction for: ${url}`);
    
    // Validate URL
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("Invalid URL provided");
    }

    try {
      // TIER 1 — direct fetch + Readability
      console.log('📥 TIER 1: Direct fetch + Readability');
      const t1 = await tryReadability(url);
      if (okText(t1?.text)) {
        console.log(`✅ TIER 1 success: ${t1!.text.length} chars`);
        return { status: "ok", ...t1! };
      }

      // TIER 2 — AMP or proxy via Jina
      console.log('📱 TIER 2: AMP and Jina proxy');
      const amp = await resolveAmp(url);
      if (amp) {
        const t2a = await tryReadability(amp);
        if (okText(t2a?.text)) {
          console.log(`✅ AMP success: ${t2a!.text.length} chars`);
          return { status: "ok", ...t2a! };
        }
      }

      // Try Jina proxy
      const jinaUrl = `https://r.jina.ai/${url.replace(/^https?:\/\//, '')}`;
      const t2b = await tryReadability(jinaUrl);
      if (okText(t2b?.text)) {
        console.log(`✅ Jina proxy success: ${t2b!.text.length} chars`);
        return { status: "ok", ...t2b! };
      }

      // TIER 3 — headless (Playwright)
      console.log('🤖 TIER 3: Headless browser');
      const t3 = await tryHeadless(url);
      if (okText(t3?.text)) {
        console.log(`✅ Headless success: ${t3!.text.length} chars`);
        return { status: "ok", ...t3! };
      }

      // All tiers failed but we might have some content
      const fallback = t1 || t2b;
      
      if (fallback) {
        console.log('⚠️ Partial content extracted, returning limited response');
        return {
          status: "limited",
          reason: "site_protection",
          ...fallback
        };
      }
      
      // No content at all
      console.log('❌ All extraction tiers failed, returning minimal response');
      return {
        status: "limited",
        reason: "site_protection",
        site: new URL(url).hostname,
        url: url,
        title: "Content Extraction Limited",
        byline: null,
        estReadMin: 1,
        text: `Content extraction limited for ${new URL(url).hostname}. This site may use strong anti-bot protection.`
      };

    } catch (error: any) {
      console.error(`💥 Extraction failed for ${url}:`, error);
      const domain = new URL(url).hostname;
      
      return {
        status: "limited",
        reason: "api_error",
        site: domain,
        url: url,
        title: "Extraction Error",
        byline: null,
        estReadMin: 1,
        text: `Failed to extract content from ${domain}. ${error?.message || error}`,
      };
    }
  }
);