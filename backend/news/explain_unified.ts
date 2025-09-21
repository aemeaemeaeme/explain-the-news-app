import { api } from "encore.dev/api";
import { analyzeWithProviders, type AnalysisResponse } from "./gemini_router";

interface ExplainRequest {
  url: string;
  pastedText?: string;
}

interface ExtractResult {
  status: "full" | "limited";
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: "factual" | "analytical" | "opinion" | "mixed";
  };
  content: string;
  processing_notes: string[];
}

// Domain policies - respectful extraction
const DOMAIN_POLICIES = {
  allowed: [
    'reuters.com',
    'apnews.com', 
    'npr.org',
    'bbc.com',
    'bbc.co.uk',
    'theguardian.com',
    'cnn.com',
    'abc.net.au',
    'cbsnews.com'
  ],
  denied: [
    'nytimes.com',
    'wsj.com',
    'washingtonpost.com',
    'ft.com',
    'bloomberg.com'
  ]
};

// Cache for successful extractions (30 minutes)
const extractionCache = new Map<string, { data: ExtractResult; timestamp: number }>();
const analysisCache = new Map<string, { data: AnalysisResponse; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking parameters
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'fbclid', 'gclid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

function isDomainAllowed(url: string): 'allowed' | 'denied' | 'unknown' {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    
    if (DOMAIN_POLICIES.allowed.some(domain => hostname.includes(domain))) {
      return 'allowed';
    }
    
    if (DOMAIN_POLICIES.denied.some(domain => hostname.includes(domain))) {
      return 'denied';
    }
    
    return 'unknown';
  } catch {
    return 'unknown';
  }
}

async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const robotsUrl = new URL('/robots.txt', url).toString();
    const response = await fetch(robotsUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; UnsupinBot/1.0; +https://example.com/bot)' },
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) return true; // If robots.txt doesn't exist, assume allowed
    
    const robotsText = await response.text();
    const lines = robotsText.split('\n').map(line => line.trim().toLowerCase());
    
    let isUserAgentMatch = false;
    for (const line of lines) {
      if (line.startsWith('user-agent:')) {
        const agent = line.split(':')[1].trim();
        isUserAgentMatch = agent === '*' || agent.includes('unsupinbot');
      } else if (isUserAgentMatch && line.startsWith('disallow:')) {
        const path = line.split(':')[1].trim();
        if (path === '/' || path === '') {
          return false; // Disallowed
        }
      }
    }
    
    return true; // Allowed by default
  } catch (error) {
    console.log('Failed to check robots.txt:', error);
    return true; // Default to allowed if check fails
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      headers: { 
        'User-Agent': 'Mozilla/5.0 (compatible; UnsupinBot/1.0; +https://example.com/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache'
      },
      redirect: 'follow',
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

function extractMetadata(html: string, url: string) {
  const extractField = (patterns: RegExp[]): string | null => {
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) {
        return match[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'");
      }
    }
    return null;
  };

  // Extract title
  const title = extractField([
    /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i,
    /<title[^>]*>([^<]*)<\/title>/i,
    /<h1[^>]*>([^<]*)<\/h1>/i
  ]) || 'Untitled Article';

  // Extract author
  const author = extractField([
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']*)["']/i,
    /<span[^>]*class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]*)<\/span>/i
  ]);

  // Extract published date
  const published = extractField([
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*name=["']date["'][^>]*content=["']([^"']*)["']/i,
    /<time[^>]*datetime=["']([^"']*)["']/i
  ]);

  // Extract site name
  const siteName = extractField([
    /<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i
  ]) || new URL(url).hostname;

  return { title, author, published, siteName };
}

function extractContent(html: string): string {
  // Remove unwanted elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '');

  // Try to find main content areas
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content|article-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i
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

  if (cleanParagraphs.length > 600) {
    return cleanParagraphs;
  }

  // Fallback: strip all HTML
  return content
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function extractContent_v2(url: string): Promise<ExtractResult> {
  const processing_notes: string[] = [];
  const hostname = new URL(url).hostname;
  
  // Check domain policy
  const domainPolicy = isDomainAllowed(url);
  
  if (domainPolicy === 'denied') {
    processing_notes.push(`Domain ${hostname} is on our exclusion list`);
    processing_notes.push("robots.txt or site policy restricts automated access");
    
    return {
      status: "limited",
      meta: {
        title: `Article from ${hostname}`,
        source: hostname,
        author: null,
        published: null,
        reading_minutes: 1,
        tone: "factual"
      },
      content: `Limited analysis available for ${hostname}. This site restricts automated content access.`,
      processing_notes
    };
  }
  
  // Check robots.txt for unknown domains
  if (domainPolicy === 'unknown') {
    const robotsAllowed = await checkRobotsTxt(url);
    if (!robotsAllowed) {
      processing_notes.push("robots.txt disallows automated access");
      
      return {
        status: "limited",
        meta: {
          title: `Article from ${hostname}`,
          source: hostname,
          author: null,
          published: null,
          reading_minutes: 1,
          tone: "factual"
        },
        content: `Limited analysis available for ${hostname}. Site's robots.txt restricts automated access.`,
        processing_notes
      };
    }
  }
  
  // Attempt content extraction with timeout
  try {
    const response = await Promise.race([
      fetchWithTimeout(url),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Extraction timeout')), 12000)
      )
    ]);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const metadata = extractMetadata(html, url);
    const content = extractContent(html);
    
    if (content.length >= 1000) {
      const wordCount = content.split(/\s+/).length;
      processing_notes.push(`Successfully extracted ${content.length} characters`);
      
      return {
        status: "full",
        meta: {
          title: metadata.title,
          source: metadata.siteName,
          author: metadata.author,
          published: metadata.published,
          reading_minutes: Math.max(1, Math.round(wordCount / 225)),
          tone: "factual"
        },
        content,
        processing_notes
      };
    } else {
      processing_notes.push("Content extraction incomplete, providing limited analysis");
      
      return {
        status: "limited",
        meta: {
          title: metadata.title || `Article from ${hostname}`,
          source: metadata.siteName || hostname,
          author: metadata.author,
          published: metadata.published,
          reading_minutes: 1,
          tone: "factual"
        },
        content: content || `Limited content available from ${hostname}. Full article extraction was not possible.`,
        processing_notes
      };
    }
  } catch (error: any) {
    processing_notes.push(`Extraction failed: ${error.message}`);
    
    return {
      status: "limited",
      meta: {
        title: `Article from ${hostname}`,
        source: hostname,
        author: null,
        published: null,
        reading_minutes: 1,
        tone: "factual"
      },
      content: `Content extraction failed for ${hostname}. ${error.message}`,
      processing_notes
    };
  }
}

export const explain = api<ExplainRequest, AnalysisResponse>(
  { expose: true, method: "POST", path: "/explain" },
  async ({ url, pastedText }) => {
    console.log(`🔍 Starting unified analysis for: ${url}`);
    
    // Handle pasted text input
    if (pastedText && pastedText.trim().length > 1000) {
      const wordCount = pastedText.split(/\s+/).length;
      const extractResult: ExtractResult = {
        status: "full",
        meta: {
          title: "User Provided Text",
          source: "user_input",
          author: null,
          published: null,
          reading_minutes: Math.max(1, Math.round(wordCount / 225)),
          tone: "factual"
        },
        content: pastedText.trim(),
        processing_notes: ["Analysis based on user-provided text content"]
      };
      
      return await analyzeWithProviders(extractResult);
    }
    
    // Validate URL
    if (!/^https?:\/\//i.test(url)) {
      throw new Error("Invalid URL provided");
    }
    
    const canonicalUrl = normalizeUrl(url);
    
    // Check cache for complete analysis first
    const analysisCacheKey = `analysis_${canonicalUrl}`;
    const cachedAnalysis = analysisCache.get(analysisCacheKey);
    if (cachedAnalysis && Date.now() - cachedAnalysis.timestamp < CACHE_TTL) {
      console.log('📋 Returning cached analysis');
      return cachedAnalysis.data;
    }
    
    // Check cache for extraction
    const extractCacheKey = `extract_${canonicalUrl}`;
    const cachedExtract = extractionCache.get(extractCacheKey);
    let extractResult: ExtractResult;
    
    if (cachedExtract && Date.now() - cachedExtract.timestamp < CACHE_TTL) {
      console.log('📋 Using cached extraction');
      extractResult = cachedExtract.data;
    } else {
      console.log('🔄 Performing fresh extraction');
      extractResult = await extractContent_v2(canonicalUrl);
      
      // Cache the extraction result
      extractionCache.set(extractCacheKey, { 
        data: extractResult, 
        timestamp: Date.now() 
      });
    }
    
    // Perform analysis
    console.log(`🧠 Starting ${extractResult.status} analysis`);
    const analysisResult = await analyzeWithProviders(extractResult);
    
    // Cache the complete analysis
    analysisCache.set(analysisCacheKey, { 
      data: analysisResult, 
      timestamp: Date.now() 
    });
    
    console.log(`✅ Unified analysis completed in ${extractResult.status} mode`);
    return analysisResult;
  }
);