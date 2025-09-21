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

const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetries(url: string, headers: Record<string, string> = {}, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          ...headers,
        },
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.log(`Fetch attempt ${i + 1} failed for ${url}:`, error);
      
      if (i < retries) {
        const backoff = 1000 + Math.random() * 2000; // 1-3 second backoff
        await sleep(backoff);
      } else {
        throw error;
      }
    }
  }
  throw new Error('All retries failed');
}

function extractMetadata(html: string, url: string) {
  const domain = new URL(url).hostname.replace(/^www\./, '');
  
  // Title extraction - prioritize og:title, then article title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*class="[^"]*(?:headline|title)[^"]*"[^>]*>([^<]+)<\/h1>/i);
  
  let title = '';
  if (ogTitleMatch) {
    title = ogTitleMatch[1].trim();
  } else if (h1Match) {
    title = h1Match[1].trim();
  } else if (titleMatch) {
    title = titleMatch[1].trim();
  } else {
    title = 'Untitled Article';
  }
  
  // Clean title
  title = title.replace(/\s+/g, ' ').replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
  
  // Byline extraction
  const bylinePatterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /<span[^>]*class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<p[^>]*class="[^"]*byline[^"]*"[^>]*>(?:By\s+)?([^<]+)<\/p>/i,
    /<div[^>]*class="[^"]*byline[^"]*"[^>]*>.*?(?:By\s+)?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
  ];
  
  let byline = null;
  for (const pattern of bylinePatterns) {
    const match = html.match(pattern);
    if (match && match[1]) {
      byline = match[1].trim().replace(/^By\s+/i, '').replace(/\s+/g, ' ');
      if (byline.length > 3 && byline.length < 100) break;
    }
  }
  
  return { title, byline, domain };
}

function readabilityExtract(html: string): { content: string; textContent: string } {
  // Remove scripts, styles, nav, ads
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share|newsletter|subscribe)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Try to find main content
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
    .filter(p => p.length > 40 && !p.match(/^(subscribe|follow|share|click)/i))
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

  return { content, textContent };
}

function findAmpUrl(html: string, originalUrl: string): string | null {
  const ampMatch = html.match(/<link[^>]*rel=["']amphtml["'][^>]*href=["']([^"']+)["']/i);
  if (ampMatch) {
    const ampUrl = ampMatch[1];
    return ampUrl.startsWith('http') ? ampUrl : new URL(ampUrl, originalUrl).href;
  }
  return null;
}

function findCanonicalUrl(html: string, originalUrl: string): string | null {
  const canonicalMatch = html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  if (canonicalMatch) {
    const canonicalUrl = canonicalMatch[1];
    return canonicalUrl.startsWith('http') ? canonicalUrl : new URL(canonicalUrl, originalUrl).href;
  }
  return null;
}

async function tryJinaProxy(url: string): Promise<{ content: string; textContent: string } | null> {
  try {
    const protocol = url.startsWith('https') ? 'https' : 'http';
    const jinaUrl = `https://r.jina.ai/${protocol}://${url.replace(/^https?:\/\//, '')}`;
    
    console.log(`Trying Jina proxy: ${jinaUrl}`);
    const html = await fetchWithRetries(jinaUrl, {}, 1);
    const result = readabilityExtract(html);
    
    if (result.textContent.length >= 1200) {
      console.log(`Jina proxy success: ${result.textContent.length} chars`);
      return result;
    }
  } catch (e) {
    console.log('Jina proxy failed:', e);
  }
  return null;
}

async function tryAmpUrl(ampUrl: string): Promise<{ content: string; textContent: string } | null> {
  try {
    console.log(`Trying AMP URL: ${ampUrl}`);
    const html = await fetchWithRetries(ampUrl, {}, 1);
    const result = readabilityExtract(html);
    
    if (result.textContent.length >= 1200) {
      console.log(`AMP success: ${result.textContent.length} chars`);
      return result;
    }
  } catch (e) {
    console.log('AMP fetch failed:', e);
  }
  return null;
}

export const extract = api<ExtractRequest, ExtractResponse>(
  { expose: true, method: "GET", path: "/extract" },
  async ({ url }) => {
    console.log(`🔍 Starting robust extraction for: ${url}`);
    
    // Validate URL
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
        throw new Error('Invalid protocol');
      }
    } catch {
      throw new Error("Invalid URL provided");
    }
    
    const domain = parsedUrl.hostname.replace(/^www\./, '');
    let finalUrl = url;
    let diagnostic = { tier1: false, tier2: false, tier3: false };
    
    try {
      // TIER 1 - FAST FETCH
      console.log('📥 TIER 1: Fast fetch with desktop headers');
      const html = await fetchWithRetries(url);
      const metadata = extractMetadata(html, url);
      finalUrl = url; // Track redirects if needed
      
      let result = readabilityExtract(html);
      diagnostic.tier1 = true;
      
      if (result.textContent.length >= 1200) {
        console.log(`✅ TIER 1 success: ${result.textContent.length} chars`);
        return {
          status: "ok",
          site: domain,
          url: finalUrl,
          title: metadata.title,
          byline: metadata.byline,
          estReadMin: Math.max(1, Math.round(result.textContent.split(/\s+/).length / 225)),
          html: result.content,
          text: result.textContent
        };
      }
      
      // TIER 2 - ALT SOURCES
      console.log('📱 TIER 2: Alternative sources (AMP, canonical, Jina proxy)');
      diagnostic.tier2 = true;
      
      // Try AMP version
      const ampUrl = findAmpUrl(html, url);
      if (ampUrl) {
        const ampResult = await tryAmpUrl(ampUrl);
        if (ampResult && ampResult.textContent.length >= 1200) {
          return {
            status: "ok",
            site: domain,
            url: ampUrl,
            title: metadata.title,
            byline: metadata.byline,
            estReadMin: Math.max(1, Math.round(ampResult.textContent.split(/\s+/).length / 225)),
            html: ampResult.content,
            text: ampResult.textContent
          };
        }
      }
      
      // Try canonical URL if different
      const canonicalUrl = findCanonicalUrl(html, url);
      if (canonicalUrl && canonicalUrl !== url) {
        try {
          const canonicalHtml = await fetchWithRetries(canonicalUrl, {}, 1);
          const canonicalResult = readabilityExtract(canonicalHtml);
          if (canonicalResult.textContent.length >= 1200) {
            console.log(`✅ Canonical URL success: ${canonicalResult.textContent.length} chars`);
            return {
              status: "ok",
              site: domain,
              url: canonicalUrl,
              title: metadata.title,
              byline: metadata.byline,
              estReadMin: Math.max(1, Math.round(canonicalResult.textContent.split(/\s+/).length / 225)),
              html: canonicalResult.content,
              text: canonicalResult.textContent
            };
          }
        } catch (e) {
          console.log('Canonical URL failed:', e);
        }
      }
      
      // Try Jina proxy
      const jinaResult = await tryJinaProxy(url);
      if (jinaResult && jinaResult.textContent.length >= 1200) {
        return {
          status: "ok",
          site: domain,
          url: finalUrl,
          title: metadata.title,
          byline: metadata.byline,
          estReadMin: Math.max(1, Math.round(jinaResult.textContent.split(/\s+/).length / 225)),
          html: jinaResult.content,
          text: jinaResult.textContent
        };
      }
      
      // TIER 3 - HEADLESS (placeholder for now - would need Playwright/Puppeteer)
      console.log('🤖 TIER 3: Headless browser (not implemented yet)');
      diagnostic.tier3 = false; // Would be true if we had headless
      
      // If we have some content but not enough, return limited
      if (result.textContent.length >= 400) {
        console.log(`⚠️ Limited content extracted: ${result.textContent.length} chars`);
        return {
          status: "limited",
          site: domain,
          url: finalUrl,
          title: metadata.title,
          byline: metadata.byline,
          estReadMin: Math.max(1, Math.round(result.textContent.split(/\s+/).length / 225)),
          text: result.textContent,
          reason: "limited_content"
        };
      }
      
      // All tiers failed
      console.log(`❌ All extraction tiers failed`);
      return {
        status: "limited",
        site: domain,
        url: finalUrl,
        title: metadata.title,
        byline: metadata.byline,
        estReadMin: 1,
        text: `Content extraction limited for ${domain}. This site may use strong anti-bot protection.`,
        reason: "site_protection"
      };
      
    } catch (error) {
      console.error(`💥 Extraction failed for ${url}:`, error);
      
      return {
        status: "limited",
        site: domain,
        url: finalUrl,
        title: "Content Extraction Failed",
        byline: null,
        estReadMin: 1,
        text: `Failed to extract content from ${domain}. This site may have strong anti-bot protection.`,
        reason: "extraction_failed"
      };
    }
  }
);