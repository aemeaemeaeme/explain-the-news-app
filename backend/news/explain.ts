import { api } from "encore.dev/api";
import { extractArticle } from "./robust_extractor";
import { analyzeWithLLM, UnifiedAnalysisResponse } from "./llm_router";

// Request/Response interfaces
export interface ExplainRequest {
  url: string;
  title?: string;
  text?: string;
}

// Cache for short-lived results (10 minutes)
const resultCache = new Map<string, { data: UnifiedAnalysisResponse; expiry: number }>();
const CACHE_TTL = 10 * 60 * 1000; // 10 minutes

// Rate limiting per IP
const rateLimits = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_MAX = 20; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now();
  const limit = rateLimits.get(ip);
  
  if (!limit || now > limit.resetTime) {
    const resetTime = now + RATE_LIMIT_WINDOW;
    rateLimits.set(ip, { count: 1, resetTime });
    return { allowed: true, remaining: RATE_LIMIT_MAX - 1, resetTime };
  }
  
  if (limit.count >= RATE_LIMIT_MAX) {
    return { allowed: false, remaining: 0, resetTime: limit.resetTime };
  }
  
  limit.count++;
  return { allowed: true, remaining: RATE_LIMIT_MAX - limit.count, resetTime: limit.resetTime };
}

function getCacheKey(url: string): string {
  try {
    const urlObj = new URL(url);
    return `${urlObj.hostname}${urlObj.pathname}`;
  } catch {
    return url;
  }
}

function cleanupCache(): void {
  const now = Date.now();
  for (const [key, value] of resultCache.entries()) {
    if (now > value.expiry) {
      resultCache.delete(key);
    }
  }
}

// Main explanation endpoint
export const explain = api<ExplainRequest, UnifiedAnalysisResponse>(
  { expose: true, method: "POST", path: "/api/explain" },
  async ({ url, title, text }) => {
    const startTime = Date.now();
    
    // Validate input
    if (!url || typeof url !== "string") {
      return createErrorResponse(url || "", "Invalid URL provided", startTime);
    }

    try {
      new URL(url);
    } catch {
      return createErrorResponse(url, "Malformed URL provided", startTime);
    }

    // Get client IP (in production this would come from headers)
    const clientIP = "127.0.0.1"; // Default for development
    
    // Check rate limit
    const rateCheck = checkRateLimit(clientIP);
    if (!rateCheck.allowed) {
      return createErrorResponse(url, "Rate limit exceeded. Please try again later.", startTime, [{
        code: "rate_limit",
        message: `Too many requests. Limit resets at ${new Date(rateCheck.resetTime).toISOString()}`
      }]);
    }

    // Clean up expired cache entries periodically
    if (Math.random() < 0.1) {
      cleanupCache();
    }

    // Check cache
    const cacheKey = getCacheKey(url);
    const cached = resultCache.get(cacheKey);
    if (cached && Date.now() < cached.expiry) {
      console.log(`📦 Cache hit for ${cacheKey}`);
      cached.data.meta.elapsed_ms = Date.now() - startTime;
      return cached.data;
    }

    try {
      // Log request
      console.log(`🔍 Processing: ${url} (IP: ${clientIP})`);

      let extractionResult;
      let analysisInput: string;
      let analysisTitle: string;
      let isLimited = false;

      // Use provided text if available, otherwise extract
      if (text && title) {
        console.log("📝 Using provided text and title");
        extractionResult = {
          status: "full" as const,
          url,
          site: new URL(url).hostname,
          title,
          byline: null,
          text,
          readTimeMin: Math.max(1, Math.round(text.split(/\s+/).length / 225)),
          extractionMethod: "provided",
          confidence: "high" as const,
          errors: []
        };
        analysisInput = text;
        analysisTitle = title;
      } else {
        // Extract content from URL
        console.log("🌐 Extracting content from URL");
        extractionResult = await extractArticle(url);
        analysisInput = extractionResult.text;
        analysisTitle = extractionResult.title;
        isLimited = extractionResult.status !== "full";
      }

      // Log extraction results
      console.log(`📊 Extraction: ${extractionResult.status} | Method: ${extractionResult.extractionMethod} | Confidence: ${extractionResult.confidence} | Length: ${analysisInput.length} chars`);

      // Analyze with LLM
      console.log("🤖 Starting LLM analysis");
      const analysis = await analyzeWithLLM(analysisInput, url, analysisTitle, isLimited);

      // Update metadata
      analysis.meta.elapsed_ms = Date.now() - startTime;
      analysis.meta.status = extractionResult.status;

      // Add extraction errors to analysis errors
      if (extractionResult.errors.length > 0) {
        analysis.errors.push(...extractionResult.errors.map(error => ({
          code: "extraction_error",
          message: error
        })));
      }

      // Cache successful results
      if (analysis.meta.status !== "error") {
        resultCache.set(cacheKey, {
          data: { ...analysis },
          expiry: Date.now() + CACHE_TTL
        });
      }

      console.log(`✅ Analysis complete: ${analysis.meta.provider} | Status: ${analysis.meta.status} | Total time: ${analysis.meta.elapsed_ms}ms`);
      
      return analysis;

    } catch (error: any) {
      console.error(`💥 Analysis failed for ${url}:`, error);
      
      return createErrorResponse(url, "Analysis failed due to unexpected error", startTime, [{
        code: "analysis_error",
        message: error.message || String(error)
      }]);
    }
  }
);

// Helper function to create error responses
function createErrorResponse(
  url: string, 
  message: string, 
  startTime: number, 
  errors: Array<{ code: string; message: string }> = []
): UnifiedAnalysisResponse {
  const site = url ? new URL(url).hostname : "unknown";
  
  return {
    meta: {
      provider: "openai",
      model: "error",
      elapsed_ms: Date.now() - startTime,
      site,
      url,
      status: "error"
    },
    header: {
      title: "Analysis Failed",
      byline: null,
      read_time_min: null,
      tone: "unknown"
    },
    tldr: message,
    eli5: "Something went wrong while trying to analyze this article. You might want to visit the original link directly to read the content.",
    why_it_matters: [
      "Service reliability is important for user experience",
      "Original sources remain the most authoritative references",
      "Technical issues can affect automated analysis systems"
    ],
    key_points: [
      { tag: "fact", text: "Automated analysis encountered an error" },
      { tag: "stakeholders", text: "Users should visit original source for content" },
      { tag: "timeline", text: "Error occurred during processing attempt" }
    ],
    bias: {
      left_pct: 0,
      center_pct: 100,
      right_pct: 0,
      confidence: "low",
      note: "Cannot analyze bias due to processing error"
    },
    sentiment: {
      positive_pct: 0,
      neutral_pct: 100,
      negative_pct: 0,
      note: "Cannot analyze sentiment due to processing error"
    },
    perspectives: {
      left_view: [],
      center_view: ["Technical issues affect all users equally"],
      right_view: []
    },
    common_ground: [
      "Users expect reliable service",
      "Original sources are authoritative",
      "Technical challenges require robust systems"
    ],
    glossary: [
      { term: "Analysis error", definition: "When automated systems fail to process content successfully" },
      { term: "Rate limit", definition: "Maximum number of requests allowed in a time period" },
      { term: "Extraction", definition: "Process of getting readable text from web pages" }
    ],
    errors: [
      { code: "general_error", message },
      ...errors
    ]
  };
}