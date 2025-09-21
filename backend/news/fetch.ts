import { api } from "encore.dev/api";

interface FetchArticleRequest {
  url: string;
}

interface FetchArticleResponse {
  title: string;
  byline: string;
  domain: string;
  content: string;
  publishedAt: string;
  status: "ok" | "limited";
  confidence: "high" | "medium" | "low";
  charCount: number;
  extractionStep: number;
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
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.text();
    } catch (error) {
      console.log(`Attempt ${i + 1} failed for ${url}:`, error);
      
      if (i < retries) {
        // Jittered backoff: 400-700ms
        const backoff = 400 + Math.random() * 300;
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
  
  // Title extraction
  const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i);
  const title = (ogTitleMatch?.[1] || titleMatch?.[1] || 'Untitled Article').trim();
  
  // Byline extraction
  const bylinePatterns = [
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']+)["']/i,
    /<span[^>]*class="[^"]*author[^"]*"[^>]*>([^<]+)<\/span>/i,
    /<p[^>]*class="[^"]*byline[^"]*"[^>]*>([^<]+)<\/p>/i,
    /By ([A-Z][a-z]+ [A-Z][a-z]+)/i
  ];
  
  let byline = '';
  for (const pattern of bylinePatterns) {
    const match = html.match(pattern);
    if (match) {
      byline = match[1].trim();
      break;
    }
  }
  
  // Published date
  const datePatterns = [
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']+)["']/i,
    /<time[^>]*datetime=["']([^"']+)["']/i,
    /<meta[^>]*name=["']date["'][^>]*content=["']([^"']+)["']/i
  ];
  
  let publishedAt = '';
  for (const pattern of datePatterns) {
    const match = html.match(pattern);
    if (match) {
      publishedAt = match[1].trim();
      break;
    }
  }
  
  return { title, byline, domain, publishedAt };
}

function simpleReadability(html: string): string {
  // Remove scripts, styles, nav, header, footer, aside
  let content = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*ad[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div[^>]*class="[^"]*subscribe[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Extract main content areas
  const contentSelectors = [
    'article',
    '[role="main"]',
    'main',
    '.article-content',
    '.story-body',
    '.entry-content',
    '#article-body'
  ];

  for (const selector of contentSelectors) {
    if (selector.startsWith('.') || selector.startsWith('#')) {
      const className = selector.substring(1);
      const regex = new RegExp(`<[^>]*(?:class|id)="[^"]*${className}[^"]*"[^>]*>([\\s\\S]*?)<\/[^>]+>`, 'i');
      const match = content.match(regex);
      if (match && match[1].length > 300) {
        content = match[1];
        break;
      }
    }
  }

  // Extract paragraphs
  const paragraphs = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi) || [];
  const paragraphText = paragraphs
    .map(p => p.replace(/<[^>]+>/g, ' ').trim())
    .filter(p => p.length > 20)
    .join(' ');

  if (paragraphText.length > 300) {
    return paragraphText;
  }

  // Fallback: all text content
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function findAmpUrl(html: string): string | null {
  const ampMatch = html.match(/<link[^>]*rel=["']amphtml["'][^>]*href=["']([^"']+)["']/i);
  return ampMatch ? ampMatch[1] : null;
}

function extractJsonLd(html: string): string {
  const jsonLdMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([^<]+)<\/script>/gi);
  
  if (!jsonLdMatches) return '';
  
  for (const match of jsonLdMatches) {
    try {
      const jsonText = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '');
      const data = JSON.parse(jsonText);
      
      if (data['@type'] === 'NewsArticle' || data['@type'] === 'Article') {
        if (data.articleBody) {
          return data.articleBody;
        }
        if (data.text) {
          return data.text;
        }
        if (Array.isArray(data.paragraph)) {
          return data.paragraph.join(' ');
        }
      }
    } catch (e) {
      // Continue to next match
    }
  }
  
  return '';
}

function extractOpenGraphMeta(html: string): string {
  const ogDescription = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i);
  const twitterDescription = html.match(/<meta[^>]*name=["']twitter:description["'][^>]*content=["']([^"']+)["']/i);
  
  let content = '';
  if (ogDescription) content += ogDescription[1] + ' ';
  if (twitterDescription) content += twitterDescription[1] + ' ';
  
  // Add some visible paragraph content
  const visiblePs = html.match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
  const textContent = visiblePs
    .slice(0, 5)
    .map(p => p.replace(/<[^>]+>/g, '').trim())
    .join(' ');
  
  return (content + textContent).trim();
}

async function tryCommonAmpPatterns(originalUrl: string): Promise<string | null> {
  const url = new URL(originalUrl);
  const ampVariants = [
    `${url.protocol}//${url.host}${url.pathname}/amp`,
    `${url.protocol}//${url.host}${url.pathname}?amp`,
    `${url.protocol}//${url.host}${url.pathname}?output=amp`,
    `${url.protocol}//${url.host}${url.pathname}/amp.html`,
    `${url.protocol}//${url.host}${url.pathname}?outputType=amp`
  ];

  for (const ampUrl of ampVariants) {
    try {
      const html = await fetchWithRetries(ampUrl, 1);
      const content = simpleReadability(html);
      if (content.length >= 900) {
        return content;
      }
    } catch (e) {
      // Continue to next variant
    }
  }
  
  return null;
}

function getDomainAdapter(domain: string) {
  const adapters: Record<string, (html: string) => string> = {
    'cnn.com': (html) => {
      // Try data-editable selectors
      const editableMatches = html.match(/<[^>]*data-editable=["']text["'][^>]*>([^<]+)<\/[^>]+>/gi);
      if (editableMatches) {
        const content = editableMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).join(' ');
        if (content.length > 500) return content;
      }
      return simpleReadability(html);
    },
    
    'reuters.com': (html) => {
      // Try data-testid paragraphs
      const testIdMatches = html.match(/<p[^>]*data-testid=["']paragraph-\d+["'][^>]*>([^<]+)<\/p>/gi);
      if (testIdMatches) {
        const content = testIdMatches.map(m => m.replace(/<[^>]+>/g, '').trim()).join(' ');
        if (content.length > 500) return content;
      }
      return simpleReadability(html);
    },
    
    'apnews.com': (html) => {
      // Try article[data-component="Story"] p
      const storyMatch = html.match(/<article[^>]*data-component=["']Story["'][^>]*>([\s\S]*?)<\/article>/i);
      if (storyMatch) {
        const paragraphs = storyMatch[1].match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
        const content = paragraphs.map(p => p.replace(/<[^>]+>/g, '').trim()).join(' ');
        if (content.length > 500) return content;
      }
      return simpleReadability(html);
    },
    
    'politico.com': (html) => {
      return simpleReadability(html);
    },
    
    'foxnews.com': (html) => {
      // Try article-body selector
      const bodyMatch = html.match(/<div[^>]*class="[^"]*article-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
      if (bodyMatch) {
        const paragraphs = bodyMatch[1].match(/<p[^>]*>([^<]+)<\/p>/gi) || [];
        const content = paragraphs.map(p => p.replace(/<[^>]+>/g, '').trim()).join(' ');
        if (content.length > 500) return content;
      }
      return simpleReadability(html);
    }
  };

  return adapters[domain] || simpleReadability;
}

export const fetchArticle = api<FetchArticleRequest, FetchArticleResponse>(
  { expose: true, method: "POST", path: "/fetch-article" },
  async ({ url }) => {
    console.log(`Starting extraction for: ${url}`);
    
    try {
      new URL(url);
    } catch {
      throw new Error("Invalid URL provided");
    }
    
    const domain = new URL(url).hostname.replace(/^www\./, '');
    let html: string;
    let content = '';
    let extractionStep = 0;
    let confidence: "high" | "medium" | "low" = "low";
    
    try {
      // Fetch the main HTML
      html = await fetchWithRetries(url);
      
      // Extract metadata
      const metadata = extractMetadata(html, url);
      
      // Step 1: Direct HTML + Readability
      extractionStep = 1;
      const adapter = getDomainAdapter(domain);
      content = adapter(html);
      
      if (content.length >= 1200) {
        confidence = "high";
        console.log(`✓ Step 1 success: ${content.length} chars`);
      } else {
        // Step 2: AMP auto-discover
        extractionStep = 2;
        const ampUrl = findAmpUrl(html);
        
        if (ampUrl) {
          try {
            const ampHtml = await fetchWithRetries(ampUrl);
            content = simpleReadability(ampHtml);
            if (content.length >= 900) {
              confidence = "high";
              console.log(`✓ Step 2 AMP success: ${content.length} chars`);
            }
          } catch (e) {
            console.log(`✗ AMP fetch failed: ${e}`);
          }
        }
        
        if (content.length < 900) {
          // Try common AMP patterns
          const ampContent = await tryCommonAmpPatterns(url);
          if (ampContent && ampContent.length >= 900) {
            content = ampContent;
            confidence = "high";
            console.log(`✓ Step 2 AMP patterns success: ${content.length} chars`);
          }
        }
        
        if (content.length < 900) {
          // Step 3: JSON-LD Article
          extractionStep = 3;
          const jsonLdContent = extractJsonLd(html);
          if (jsonLdContent.length >= 900) {
            content = jsonLdContent;
            confidence = "medium";
            console.log(`✓ Step 3 JSON-LD success: ${content.length} chars`);
          } else if (content.length < 700) {
            // Step 4: Open Graph / Twitter meta fallback
            extractionStep = 4;
            const metaContent = extractOpenGraphMeta(html);
            if (metaContent.length >= 700) {
              content = metaContent;
              confidence = "low";
              console.log(`✓ Step 4 meta fallback: ${content.length} chars`);
            }
          }
        }
      }
      
      // Determine final status
      const status: "ok" | "limited" = content.length >= 700 ? "ok" : "limited";
      const charCount = content.length;
      
      console.log(`Final result: ${status}, ${charCount} chars, step ${extractionStep}, confidence ${confidence}`);
      
      return {
        title: metadata.title,
        byline: metadata.byline || "Unknown",
        domain: metadata.domain,
        content: content || `Limited content extracted from ${metadata.domain}. This may be due to paywall protection or anti-bot measures.`,
        publishedAt: metadata.publishedAt || "unknown",
        status,
        confidence,
        charCount,
        extractionStep
      };
      
    } catch (error) {
      console.error(`Extraction failed for ${url}:`, error);
      const domain = new URL(url).hostname.replace(/^www\./, '');
      
      return {
        title: "Content Extraction Failed",
        byline: "Unknown",
        domain,
        content: `Failed to extract content from ${domain}. This site may have strong anti-bot protection or technical barriers.`,
        publishedAt: "unknown",
        status: "limited",
        confidence: "low",
        charCount: 0,
        extractionStep: 0
      };
    }
  }
);