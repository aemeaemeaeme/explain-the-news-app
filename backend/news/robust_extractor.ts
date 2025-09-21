import { secret } from "encore.dev/config";

// User agent for web requests
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

// Rate limiting for external requests
const requestLimiter = new Map<string, { count: number; resetTime: number }>();

// Extraction result interface
export interface ExtractionResult {
  status: "full" | "limited" | "error";
  url: string;
  site: string;
  title: string;
  byline: string | null;
  text: string;
  readTimeMin: number;
  extractionMethod: string;
  confidence: "high" | "medium" | "low";
  errors: string[];
}

// Rate limit check
function checkRateLimit(domain: string): boolean {
  const now = Date.now();
  const limit = requestLimiter.get(domain);
  
  if (!limit || now > limit.resetTime) {
    requestLimiter.set(domain, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }
  
  if (limit.count >= 5) { // Max 5 requests per minute per domain
    return false;
  }
  
  limit.count++;
  return true;
}

// Fetch with timeout and retries
async function fetchWithRetry(url: string, options: RequestInit = {}, retries = 2): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  const defaultOptions: RequestInit = {
    headers: {
      "User-Agent": USER_AGENT,
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      "DNT": "1"
    },
    redirect: "follow",
    signal: controller.signal,
    ...options
  };

  try {
    const response = await fetch(url, defaultOptions);
    clearTimeout(timeoutId);
    
    if (!response.ok && retries > 0) {
      // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (retries > 0 && !controller.signal.aborted) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, 3 - retries) * 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    
    throw error;
  }
}

// Check robots.txt compliance (basic check)
async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", url).toString();
    const response = await fetchWithRetry(robotsUrl, {}, 0); // No retries for robots.txt
    
    if (!response.ok) return true; // Assume allowed if robots.txt not found
    
    const robotsText = await response.text();
    const userAgentSection = robotsText.match(/User-agent:\s*\*/i);
    
    if (userAgentSection) {
      const disallowRules = robotsText.match(/Disallow:\s*(.+)/gi) || [];
      const urlPath = new URL(url).pathname;
      
      for (const rule of disallowRules) {
        const path = rule.replace(/Disallow:\s*/i, '').trim();
        if (path === '/' || (path && urlPath.startsWith(path))) {
          return false; // Disallowed
        }
      }
    }
    
    return true; // Allowed
  } catch (error) {
    console.log("Robots.txt check failed, assuming allowed:", error);
    return true; // Assume allowed on error
  }
}

// Extract metadata from HTML
function extractMetadata(html: string, url: string): { title: string; byline: string | null; description: string } {
  const title = 
    html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] ||
    "Untitled Article";

  const byline = 
    html.match(/<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    null;

  const description = 
    html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i)?.[1] ||
    "";

  return {
    title: title.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim(),
    byline: byline ? byline.replace(/^By\s+/i, '').trim() : null,
    description: description.replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&#39;/g, "'").trim()
  };
}

// Clean and extract readable text using Readability-like algorithm
function extractReadableText(html: string): string {
  // Remove non-content elements
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<nav[\s\S]*?<\/nav>/gi, '')
    .replace(/<header[\s\S]*?<\/header>/gi, '')
    .replace(/<footer[\s\S]*?<\/footer>/gi, '')
    .replace(/<aside[\s\S]*?<\/aside>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share|newsletter|subscribe|comments)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

  // Find main content areas
  const contentSelectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content|article-body|content-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
    /<div[^>]*id="[^"]*(?:article|story|content|main-content)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<section[^>]*class="[^"]*(?:article|story|content)[^"]*"[^>]*>([\s\S]*?)<\/section>/i
  ];

  let content = cleaned;
  for (const selector of contentSelectors) {
    const match = cleaned.match(selector);
    if (match && match[1] && match[1].length > 500) {
      content = match[1];
      break;
    }
  }

  // Extract paragraphs and clean them
  const paragraphs = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi) || [];
  const cleanParagraphs = paragraphs
    .map(p => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(p => p.length > 30 && !p.match(/^(subscribe|follow|share|click|advertisement|cookie|privacy)/i))
    .join('\n\n');

  // Fallback to general text extraction
  if (cleanParagraphs.length < 300) {
    const fallbackText = content
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    return fallbackText.length > cleanParagraphs.length ? fallbackText : cleanParagraphs;
  }

  return cleanParagraphs;
}

// Strategy 1: Direct HTTP fetch with metadata parse
async function directFetch(url: string): Promise<ExtractionResult | null> {
  try {
    const domain = new URL(url).hostname;
    if (!checkRateLimit(domain)) {
      throw new Error("Rate limit exceeded for domain");
    }

    const response = await fetchWithRetry(url);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const contentType = response.headers.get("content-type") || "";
    if (!contentType.includes("text/html")) {
      throw new Error(`Non-HTML content type: ${contentType}`);
    }

    const html = await response.text();
    const metadata = extractMetadata(html, url);
    const text = extractReadableText(html);

    if (text.length >= 800) {
      return {
        status: "full",
        url,
        site: domain,
        title: metadata.title,
        byline: metadata.byline,
        text,
        readTimeMin: Math.max(1, Math.round(text.split(/\s+/).length / 225)),
        extractionMethod: "direct_fetch",
        confidence: text.length > 1500 ? "high" : "medium",
        errors: []
      };
    }

    // Return limited result if we have some content
    if (text.length >= 200 || metadata.description) {
      return {
        status: "limited",
        url,
        site: domain,
        title: metadata.title,
        byline: metadata.byline,
        text: text || metadata.description || "Limited content available",
        readTimeMin: Math.max(1, Math.round((text || metadata.description).split(/\s+/).length / 225)),
        extractionMethod: "direct_fetch_limited",
        confidence: "low",
        errors: ["Insufficient content extracted"]
      };
    }

    return null;
  } catch (error) {
    console.log("Direct fetch failed:", error);
    return null;
  }
}

// Strategy 2: Readability pass over the same HTML
async function readabilityPass(url: string): Promise<ExtractionResult | null> {
  try {
    const domain = new URL(url).hostname;
    const response = await fetchWithRetry(url);
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const metadata = extractMetadata(html, url);
    
    // More aggressive content extraction
    let content = html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<nav[\s\S]*?<\/nav>/gi, '')
      .replace(/<footer[\s\S]*?<\/footer>/gi, '')
      .replace(/<aside[\s\S]*?<\/aside>/gi, '');

    // Score paragraphs by content density
    const paragraphs = content.match(/<p[^>]*>[\s\S]*?<\/p>/gi) || [];
    const scoredParagraphs = paragraphs
      .map(p => {
        const text = p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
        const linkDensity = (p.match(/<a[^>]*>/gi) || []).length / Math.max(1, text.split(/\s+/).length);
        const score = text.length * (1 - linkDensity);
        return { text, score };
      })
      .filter(p => p.score > 25)
      .sort((a, b) => b.score - a.score);

    const extractedText = scoredParagraphs.slice(0, 20).map(p => p.text).join('\n\n');

    if (extractedText.length >= 800) {
      return {
        status: "full",
        url,
        site: domain,
        title: metadata.title,
        byline: metadata.byline,
        text: extractedText,
        readTimeMin: Math.max(1, Math.round(extractedText.split(/\s+/).length / 225)),
        extractionMethod: "readability_pass",
        confidence: extractedText.length > 1500 ? "high" : "medium",
        errors: []
      };
    }

    return null;
  } catch (error) {
    console.log("Readability pass failed:", error);
    return null;
  }
}

// Strategy 3: Metadata-only fallback
async function metadataFallback(url: string): Promise<ExtractionResult> {
  try {
    const domain = new URL(url).hostname;
    const response = await fetchWithRetry(url);
    
    let metadata: { title: string; byline: string | null; description: string } = { title: "Content Extraction Limited", byline: null, description: "" };
    
    if (response.ok) {
      const html = await response.text();
      metadata = extractMetadata(html, url);
    }

    const limitedText = metadata.description || 
      `Limited Analysis — full text could not be extracted due to site restrictions. This content from ${domain} may be behind a paywall or use anti-bot protection.`;

    return {
      status: "limited",
      url,
      site: domain,
      title: metadata.title,
      byline: metadata.byline,
      text: limitedText,
      readTimeMin: 1,
      extractionMethod: "metadata_only",
      confidence: "low",
      errors: ["Full content extraction blocked", "Using metadata and description only"]
    };
  } catch (error) {
    const domain = new URL(url).hostname;
    return {
      status: "error",
      url,
      site: domain,
      title: "Extraction Failed",
      byline: null,
      text: `Failed to extract content from ${domain}. Network error or site protection detected.`,
      readTimeMin: 1,
      extractionMethod: "error_fallback",
      confidence: "low",
      errors: [error instanceof Error ? error.message : String(error)]
    };
  }
}

// Optional Strategy 4: External API sources (if configured)
async function tryPublicAPI(url: string): Promise<ExtractionResult | null> {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    
    // Example: The Guardian API (if API key is available)
    if (domain.includes('theguardian.com')) {
      // This would require a Guardian API key in secrets
      // For now, we'll skip this implementation
      console.log("Guardian API integration not configured");
      return null;
    }
    
    // Example: NYT API integration could go here
    // For now, return null to skip this strategy
    return null;
  } catch (error) {
    console.log("Public API extraction failed:", error);
    return null;
  }
}

// Main extraction function with layered fallbacks
export async function extractArticle(url: string): Promise<ExtractionResult> {
  console.log(`🔍 Starting robust extraction for: ${url}`);
  
  // Validate URL
  try {
    new URL(url);
  } catch {
    throw new Error("Invalid URL provided");
  }

  // Check robots.txt compliance
  const robotsAllowed = await checkRobotsTxt(url);
  if (!robotsAllowed) {
    console.log("❌ Robots.txt disallows access");
    return {
      status: "limited",
      url,
      site: new URL(url).hostname,
      title: "Access Restricted",
      byline: null,
      text: "This site's robots.txt file restricts automated access. Please visit the original URL to read the full article.",
      readTimeMin: 1,
      extractionMethod: "robots_blocked",
      confidence: "low",
      errors: ["Robots.txt disallows automated access"]
    };
  }

  // Strategy 1: Direct HTTP fetch + meta parse
  console.log("📥 TIER 1: Direct fetch + metadata parse");
  const tier1Result = await directFetch(url);
  if (tier1Result && tier1Result.status === "full") {
    console.log(`✅ TIER 1 success: ${tier1Result.text.length} chars`);
    return tier1Result;
  }

  // Strategy 2: Readability pass over fetched HTML
  console.log("📄 TIER 2: Readability extraction");
  const tier2Result = await readabilityPass(url);
  if (tier2Result && tier2Result.status === "full") {
    console.log(`✅ TIER 2 success: ${tier2Result.text.length} chars`);
    return tier2Result;
  }

  // Strategy 3: Try public APIs (if available)
  console.log("🔌 TIER 3: Public API sources");
  const tier3Result = await tryPublicAPI(url);
  if (tier3Result && tier3Result.status === "full") {
    console.log(`✅ TIER 3 success: ${tier3Result.text.length} chars`);
    return tier3Result;
  }

  // Return the best limited result we found, or metadata fallback
  const limitedResult = tier1Result || tier2Result;
  if (limitedResult && limitedResult.status === "limited") {
    console.log(`⚠️ Returning limited result: ${limitedResult.text.length} chars`);
    return limitedResult;
  }

  // Final fallback: metadata only
  console.log("💡 TIER 4: Metadata fallback");
  const fallbackResult = await metadataFallback(url);
  console.log(`📋 Metadata fallback: ${fallbackResult.text.length} chars`);
  return fallbackResult;
}