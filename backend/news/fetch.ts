import { api } from "encore.dev/api";

interface FetchArticleRequest {
  url: string;
}

interface FetchArticleResponse {
  status: "ok" | "limited";
  title: string;
  byline: string | null;
  content: string;
  text: string;
  site: string;
  estReadMin: number;
  reason?: string;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithRetries(url: string, retries = 2): Promise<string> {
  for (let i = 0; i <= retries; i++) {
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': getRandomUserAgent(),
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Cache-Control': 'no-cache',
          'Accept-Encoding': 'gzip, deflate',
        },
        signal: AbortSignal.timeout(15000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}:`, error);
      
      if (i < retries) {
        const backoff = 500 + Math.random() * 1000;
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
  
  // Title extraction - prioritize article title over page title
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  
  let title = '';
  if (ogTitleMatch) title = ogTitleMatch[1];
  else if (h1Match) title = h1Match[1];
  else if (titleMatch) title = titleMatch[1];
  else title = 'Untitled Article';
  
  title = title.trim().replace(/\s+/g, ' ');
  
  // Byline extraction - more comprehensive
  const bylinePatterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<p[^>]*class="[^"]*byline[^"]*"[^>]*>([^<]+)<\/p>/i,
    /<div[^>]*class="[^"]*byline[^"]*"[^>]*>.*?<span[^>]*>([^<]+)<\/span>/i,
    /By\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/i,
    /<address[^>]*>.*?([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+).*?<\/address>/i
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

function simpleReadability(html: string): { content: string; textContent: string } {
  // Remove unwanted elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*(?:subscribe|newsletter)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Try to find main content area
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*id="[^"]*(?:article|story|content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i
  ];

  let content = cleaned;
  for (const selector of contentSelectors) {
    const match = cleaned.match(selector);
    if (match && match[1] && match[1].length > 500) {
      content = match[1];
      break;
    }
  }

  // Extract paragraphs and meaningful text
  const paragraphs = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi) || [];
  const cleanParagraphs = paragraphs
    .map(p => p.replace(/<[^>]+>/g, ' ').trim())
    .filter(p => p.length > 30)
    .join('\n\n');

  // If paragraphs are good, use them; otherwise strip all HTML
  let textContent;
  if (cleanParagraphs.length > 300) {
    textContent = cleanParagraphs;
  } else {
    textContent = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  return { 
    content: content, 
    textContent: textContent
  };
}

function findAmpUrl(html: string, originalUrl: string): string | null {
  // Look for AMP link
  const ampMatch = html.match(/<link[^>]*rel=["']amphtml["'][^>]*href=["']([^"']+)["']/i);
  if (ampMatch) {
    const ampUrl = ampMatch[1];
    return ampUrl.startsWith('http') ? ampUrl : new URL(ampUrl, originalUrl).href;
  }
  
  // Try common AMP patterns
  const url = new URL(originalUrl);
  const ampVariants = [
    `${url.protocol}//${url.host}${url.pathname}/amp`,
    `${url.protocol}//${url.host}${url.pathname}?amp=1`,
    `${url.protocol}//${url.host}${url.pathname}/amp.html`,
    `${url.protocol}//${url.host}/amp${url.pathname}`
  ];
  
  return ampVariants[0]; // Return first variant to try
}

function extractJsonLd(html: string): string {
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
  
  if (!jsonLdMatches) return '';
  
  for (const match of jsonLdMatches) {
    try {
      const jsonText = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonText);
      
      // Handle both single objects and arrays
      const items = Array.isArray(data) ? data : [data];
      
      for (const item of items) {
        if (item['@type'] === 'NewsArticle' || item['@type'] === 'Article') {
          if (item.articleBody && typeof item.articleBody === 'string') {
            return item.articleBody;
          }
          if (item.text && typeof item.text === 'string') {
            return item.text;
          }
          if (Array.isArray(item.paragraph)) {
            return item.paragraph.join('\n\n');
          }
        }
      }
    } catch (e) {
      console.log('JSON-LD parse error:', e);
    }
  }
  
  return '';
}

function extractOpenGraphContent(html: string): string {
  const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const description = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
  
  let content = '';
  if (ogDescription && ogDescription[1]) content += ogDescription[1] + '\n\n';
  if (description && description[1] && description[1] !== ogDescription?.[1]) {
    content += description[1] + '\n\n';
  }
  
  // Add some paragraph content as fallback
  const paragraphs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const firstParagraphs = paragraphs
    .slice(0, 3)
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .filter(p => p.length > 20)
    .join('\n\n');
  
  content += firstParagraphs;
  return content.trim();
}

async function tryAmpUrl(ampUrl: string): Promise<{ content: string; textContent: string } | null> {
  try {
    const html = await fetchWithRetries(ampUrl, 1);
    const result = simpleReadability(html);
    
    if (result.textContent.length >= 800) {
      return result;
    }
  } catch (e) {
    console.log('AMP fetch failed:', e);
  }
  return null;
}

function getDomainAdapter(domain: string) {
  const adapters: Record<string, (html: string) => { content: string; textContent: string }> = {
    'cnn.com': (html) => {
      // Try CNN-specific selectors
      const patterns = [
        /<div[^>]*class="[^"]*zn-body__paragraph[^"]*"[^>]*>([\s\S]*?)<\/div>/gi,
        /<div[^>]*data-editable=["']text["'][^>]*>([\s\S]*?)<\/div>/gi
      ];
      
      for (const pattern of patterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > 3) {
          const content = matches.join('\n');
          const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
          if (textContent.length > 500) {
            return { content, textContent };
          }
        }
      }
      return simpleReadability(html);
    },
    
    'reuters.com': (html) => {
      const paragraphPattern = /<p[^>]*data-testid=["']paragraph-\d+["'][^>]*>([\s\S]*?)<\/p>/gi;
      const matches = html.match(paragraphPattern);
      if (matches && matches.length > 2) {
        const content = matches.join('\n');
        const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (textContent.length > 500) {
          return { content, textContent };
        }
      }
      return simpleReadability(html);
    },
    
    'apnews.com': (html) => {
      const storyPattern = /<div[^>]*class="[^"]*RichTextStoryBody[^"]*"[^>]*>([\s\S]*?)<\/div>/i;
      const match = html.match(storyPattern);
      if (match && match[1]) {
        const content = match[1];
        const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        if (textContent.length > 500) {
          return { content, textContent };
        }
      }
      return simpleReadability(html);
    }
  };

  return adapters[domain] || simpleReadability;
}

export const fetchArticle = api<FetchArticleRequest, FetchArticleResponse>(
  { expose: true, method: "POST", path: "/extract" },
  async ({ url }) => {
    console.log(`🔍 Starting extraction for: ${url}`);
    
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL provided");
    }
    
    const domain = new URL(url).hostname.replace(/^www\./, '');
    
    try {
      // Step 1: Try direct fetch with domain adapter
      console.log('📥 Step 1: Direct fetch with domain adapter');
      const html = await fetchWithRetries(url);
      const metadata = extractMetadata(html, url);
      
      const adapter = getDomainAdapter(domain);
      let result = adapter(html);
      
      if (result.textContent.length >= 1200) {
        console.log(`✅ Step 1 success: ${result.textContent.length} chars`);
        return {
          status: "ok",
          title: metadata.title,
          byline: metadata.byline,
          content: result.content,
          text: result.textContent,
          site: metadata.domain,
          estReadMin: Math.max(1, Math.round(result.textContent.split(/\s+/).length / 225))
        };
      }
      
      // Step 2: Try AMP
      console.log('📱 Step 2: Trying AMP');
      const ampUrl = findAmpUrl(html, url);
      if (ampUrl) {
        const ampResult = await tryAmpUrl(ampUrl);
        if (ampResult && ampResult.textContent.length >= 900) {
          console.log(`✅ Step 2 AMP success: ${ampResult.textContent.length} chars`);
          return {
            status: "ok",
            title: metadata.title,
            byline: metadata.byline,
            content: ampResult.content,
            text: ampResult.textContent,
            site: metadata.domain,
            estReadMin: Math.max(1, Math.round(ampResult.textContent.split(/\s+/).length / 225))
          };
        }
      }
      
      // Step 3: Try JSON-LD
      console.log('📋 Step 3: Trying JSON-LD');
      const jsonLdContent = extractJsonLd(html);
      if (jsonLdContent.length >= 900) {
        console.log(`✅ Step 3 JSON-LD success: ${jsonLdContent.length} chars`);
        return {
          status: "ok",
          title: metadata.title,
          byline: metadata.byline,
          content: jsonLdContent,
          text: jsonLdContent,
          site: metadata.domain,
          estReadMin: Math.max(1, Math.round(jsonLdContent.split(/\s+/).length / 225))
        };
      }
      
      // Step 4: Try Open Graph fallback
      console.log('🔄 Step 4: Open Graph fallback');
      const ogContent = extractOpenGraphContent(html);
      if (ogContent.length >= 500) {
        console.log(`⚠️ Step 4 limited success: ${ogContent.length} chars`);
        return {
          status: "limited",
          title: metadata.title,
          byline: metadata.byline,
          content: ogContent,
          text: ogContent,
          site: metadata.domain,
          estReadMin: Math.max(1, Math.round(ogContent.split(/\s+/).length / 225)),
          reason: "limited_content"
        };
      }
      
      // If we reach here, we have very limited content
      console.log(`❌ All extraction methods failed, using metadata only`);
      const fallbackContent = `Content extraction limited for ${metadata.domain}. ${metadata.title}`;
      return {
        status: "limited",
        title: metadata.title,
        byline: metadata.byline,
        content: fallbackContent,
        text: fallbackContent,
        site: metadata.domain,
        estReadMin: 1,
        reason: "site_protection"
      };
      
    } catch (error) {
      console.error(`💥 Extraction failed for ${url}:`, error);
      const domain = new URL(url).hostname.replace(/^www\./, '');
      
      return {
        status: "limited",
        title: "Content Extraction Failed",
        byline: null,
        content: `Failed to extract content from ${domain}. This site may have strong anti-bot protection.`,
        text: `Failed to extract content from ${domain}. This site may have strong anti-bot protection.`,
        site: domain,
        estReadMin: 1,
        reason: "extraction_failed"
      };
    }
  }
);