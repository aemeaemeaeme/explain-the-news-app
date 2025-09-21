import { api } from "encore.dev/api";
import { analyzeWithLLM, type UnifiedAnalysisResponse } from "./llm_router";

/** —— Legacy AnalysisResponse your frontend expects (kept intact) —— */
export interface AnalysisResponse {
  status: "full" | "limited";
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: "factual" | "analytical" | "opinion" | "mixed";
    provider: "gemini";
    model: string;
    fallback_used: boolean;         // always false now (no OpenAI)
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: "fact" | "numbers" | "timeline" | "stakeholders" | "quote";
    text: string;
  }>;
  bias_analysis: {
    left: number;
    center: number;
    right: number;
    confidence: "low" | "med" | "high";
    notes: string;
  };
  sentiment: {
    positive: number;
    neutral: number;
    negative: number;
    notes: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{ term: string; definition: string }>;
  followups: string[];              // we’ll synthesize a few defaults if Gemini omits
  processing_notes: string[];
}

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

/** —— Domain policies (unchanged) —— */
const DOMAIN_POLICIES = {
  allowed: [
    "reuters.com",
    "apnews.com",
    "npr.org",
    "bbc.com",
    "bbc.co.uk",
    "theguardian.com",
    "cnn.com",
    "abc.net.au",
    "cbsnews.com",
  ],
  denied: ["nytimes.com", "wsj.com", "washingtonpost.com", "ft.com", "bloomberg.com"],
};

/** —— Simple caches (unchanged) —— */
const extractionCache = new Map<string, { data: ExtractResult; timestamp: number }>();
const analysisCache = new Map<string, { data: AnalysisResponse; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const trackingParams = [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
      "fbclid",
      "gclid",
    ];
    trackingParams.forEach((param) => parsed.searchParams.delete(param));
    return parsed.toString();
  } catch {
    return url;
  }
}

function isDomainAllowed(url: string): "allowed" | "denied" | "unknown" {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    if (DOMAIN_POLICIES.allowed.some((d) => hostname.includes(d))) return "allowed";
    if (DOMAIN_POLICIES.denied.some((d) => hostname.includes(d))) return "denied";
    return "unknown";
  } catch {
    return "unknown";
  }
}

async function checkRobotsTxt(url: string): Promise<boolean> {
  try {
    const robotsUrl = new URL("/robots.txt", url).toString();
    const response = await fetch(robotsUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; UnspinBot/1.0; +https://example.com/bot)" },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return true;
    const robotsText = await response.text();
    const lines = robotsText.split("\n").map((l) => l.trim().toLowerCase());

    let match = false;
    for (const line of lines) {
      if (line.startsWith("user-agent:")) {
        const agent = line.split(":")[1].trim();
        match = agent === "*" || agent.includes("unspinbot");
      } else if (match && line.startsWith("disallow:")) {
        const path = line.split(":")[1].trim();
        if (path === "/" || path === "") return false;
      }
    }
    return true;
  } catch {
    return true;
  }
}

async function fetchWithTimeout(url: string, timeoutMs = 10000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; UnspinBot/1.0; +https://example.com/bot)",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      redirect: "follow",
      signal: controller.signal,
    });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}

function extractMetadata(html: string, url: string) {
  const pick = (patterns: RegExp[]): string | null => {
    for (const r of patterns) {
      const m = html.match(r);
      if (m?.[1]) {
        return m[1].trim().replace(/&quot;/g, '"').replace(/&amp;/g, "&").replace(/&#39;/g, "'");
      }
    }
    return null;
  };

  const title =
    pick([
      /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["']/i,
      /<meta[^>]*name=["']twitter:title["'][^>]*content=["']([^"']*)["']/i,
      /<title[^>]*>([^<]*)<\/title>/i,
      /<h1[^>]*>([^<]*)<\/h1>/i,
    ]) || "Untitled Article";

  const author = pick([
    /<meta[^>]*name=["']author["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*property=["']article:author["'][^>]*content=["']([^"']*)["']/i,
    /<span[^>]*class="[^"]*(?:author|byline)[^"]*"[^>]*>([^<]*)<\/span>/i,
  ]);

  const published = pick([
    /<meta[^>]*property=["']article:published_time["'][^>]*content=["']([^"']*)["']/i,
    /<meta[^>]*name=["']date["'][^>]*content=["']([^"']*)["']/i,
    /<time[^>]*datetime=["']([^"']*)["']/i,
  ]);

  const siteName =
    pick([/<meta[^>]*property=["']og:site_name["'][^>]*content=["']([^"']*)["']/i]) ||
    new URL(url).hostname;

  return { title, author, published, siteName };
}

function extractContent(html: string): string {
  let cleaned = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<nav[\s\S]*?<\/nav>/gi, "")
    .replace(/<header[\s\S]*?<\/header>/gi, "")
    .replace(/<footer[\s\S]*?<\/footer>/gi, "")
    .replace(/<aside[\s\S]*?<\/aside>/gi, "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<div[^>]*class="[^"]*(?:ad|advertisement|promo|social|share)[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

  const selectors = [
    /<article[^>]*>([\s\S]*?)<\/article>/i,
    /<div[^>]*class="[^"]*(?:article-content|story-body|entry-content|post-content|article-body)[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    /<main[^>]*>([\s\S]*?)<\/main>/i,
  ];

  let content = cleaned;
  for (const sel of selectors) {
    const m = cleaned.match(sel);
    if (m?.[1] && m[1].length > 800) {
      content = m[1];
      break;
    }
  }

  const paragraphs = content.match(/<p[^>]*>([^<]+(?:<[^>]+>[^<]*<\/[^>]+>[^<]*)*)<\/p>/gi) || [];
  const text = paragraphs
    .map((p) => p.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 40 && !p.match(/^(subscribe|follow|share|click|advertisement)/i))
    .join("\n\n");

  if (text.length > 600) return text;

  return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

async function extractContent_v2(url: string): Promise<ExtractResult> {
  const processing_notes: string[] = [];
  const hostname = new URL(url).hostname;

  const policy = isDomainAllowed(url);
  if (policy === "denied") {
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
        tone: "factual",
      },
      content: `Limited analysis available for ${hostname}. This site restricts automated content access.`,
      processing_notes,
    };
  }

  if (policy === "unknown") {
    const allowed = await checkRobotsTxt(url);
    if (!allowed) {
      processing_notes.push("robots.txt disallows automated access");
      return {
        status: "limited",
        meta: {
          title: `Article from ${hostname}`,
          source: hostname,
          author: null,
          published: null,
          reading_minutes: 1,
          tone: "factual",
        },
        content: `Limited analysis available for ${hostname}. Site's robots.txt restricts automated access.`,
        processing_notes,
      };
    }
  }

  try {
    const response = await Promise.race([
      fetchWithTimeout(url),
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error("Extraction timeout")), 12000)),
    ]);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const html = await response.text();
    const meta = extractMetadata(html, url);
    const content = extractContent(html);

    if (content.length >= 1000) {
      const wc = content.split(/\s+/).length;
      processing_notes.push(`Successfully extracted ${content.length} characters`);
      return {
        status: "full",
        meta: {
          title: meta.title,
          source: meta.siteName,
          author: meta.author,
          published: meta.published,
          reading_minutes: Math.max(1, Math.round(wc / 225)),
          tone: "factual",
        },
        content,
        processing_notes,
      };
    } else {
      processing_notes.push("Content extraction incomplete, providing limited analysis");
      return {
        status: "limited",
        meta: {
          title: meta.title || `Article from ${hostname}`,
          source: meta.siteName || hostname,
          author: meta.author,
          published: meta.published,
          reading_minutes: 1,
          tone: "factual",
        },
        content: content || `Limited content available from ${hostname}. Full article extraction was not possible.`,
        processing_notes,
      };
    }
  } catch (e: any) {
    processing_notes.push(`Extraction failed: ${e.message}`);
    return {
      status: "limited",
      meta: {
        title: `Article from ${hostname}`,
        source: hostname,
        author: null,
        published: null,
        reading_minutes: 1,
        tone: "factual",
      },
      content: `Content extraction failed for ${hostname}. ${e.message}`,
      processing_notes,
    };
  }
}

/** —— Map Gemini Unified → Legacy AnalysisResponse (frontend stays happy) —— */
function mapUnifiedToLegacy(
  unified: UnifiedAnalysisResponse,
  extract: ExtractResult
): AnalysisResponse {
  return {
    status: (unified.meta.status === "full" || unified.meta.status === "limited" ? unified.meta.status : extract.status),
    meta: {
      title: extract.meta.title,
      source: extract.meta.source,
      author: extract.meta.author,
      published: extract.meta.published,
      reading_minutes: extract.meta.reading_minutes,
      // map tone roughly into your legacy union
      tone:
        unified.header.tone === "opinion"
          ? "opinion"
          : unified.header.tone === "mixed"
          ? "mixed"
          : "factual",
      provider: "gemini",
      model: unified.meta.model,
      fallback_used: false, // no OpenAI anymore
    },
    tldr: unified.tldr || "Summary not available",
    eli5: unified.eli5 || "Simplified explanation not available",
    why_it_matters: unified.why_it_matters || [],
    key_points: (unified.key_points || []).map((kp) => ({
      tag:
        kp.tag === "timeline"
          ? "timeline"
          : kp.tag === "numbers"
          ? "numbers"
          : kp.tag === "stakeholders"
          ? "stakeholders"
          : "fact",
      text: kp.text,
    })),
    bias_analysis: {
      left: unified.bias.left_pct ?? 33,
      center: unified.bias.center_pct ?? 34,
      right: unified.bias.right_pct ?? 33,
      confidence:
        unified.bias.confidence === "low"
          ? "low"
          : unified.bias.confidence === "high"
          ? "high"
          : "med",
      notes: unified.bias.note || "",
    },
    sentiment: {
      positive: unified.sentiment.positive_pct ?? 33,
      neutral: unified.sentiment.neutral_pct ?? 34,
      negative: unified.sentiment.negative_pct ?? 33,
      notes: unified.sentiment.note || "",
    },
    perspectives: {
      left_view: unified.perspectives.left_view || [],
      center_view: unified.perspectives.center_view || [],
      right_view: unified.perspectives.right_view || [],
    },
    common_ground: unified.common_ground || [],
    glossary: unified.glossary || [],
    // synthesize a few follow-ups if empty so your UI doesn't look broken
    followups:
      (unified as any).followups && Array.isArray((unified as any).followups) && (unified as any).followups.length
        ? (unified as any).followups
        : [
            "What context is missing that would change this story?",
            "Which stakeholders are most impacted and why?",
            "What are credible opposing viewpoints on this?",
          ],
    processing_notes: extract.processing_notes ?? [],
  };
}

/** —— Public API —— */
export const explain = api<ExplainRequest, AnalysisResponse>(
  { expose: true, method: "POST", path: "/explain" },
  async ({ url, pastedText }) => {
    console.log(`🔍 Starting unified (Gemini-only) analysis for: ${url}`);

    // Handle pasted text
    if (pastedText && pastedText.trim().length > 1000) {
      const wc = pastedText.split(/\s+/).length;
      const extractResult: ExtractResult = {
        status: "full",
        meta: {
          title: "User Provided Text",
          source: "user_input",
          author: null,
          published: null,
          reading_minutes: Math.max(1, Math.round(wc / 225)),
          tone: "factual",
        },
        content: pastedText.trim(),
        processing_notes: ["Analysis based on user-provided text content"],
      };

      const unified = await analyzeWithLLM(
        extractResult.content,
        "user://input",
        extractResult.meta.title,
        false
      );
      return mapUnifiedToLegacy(unified, extractResult);
    }

    // URL mode
    if (!/^https?:\/\//i.test(url)) throw new Error("Invalid URL provided");
    const canonicalUrl = normalizeUrl(url);

    // Return cached analysis if present
    const AN_KEY = `analysis_${canonicalUrl}`;
    const cached = analysisCache.get(AN_KEY);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log("📋 Returning cached analysis");
      return cached.data;
    }

    // Extraction (with its own cache)
    const EX_KEY = `extract_${canonicalUrl}`;
    let extractResult = extractionCache.get(EX_KEY)?.data;
    if (!extractResult || Date.now() - (extractionCache.get(EX_KEY)!.timestamp) >= CACHE_TTL) {
      console.log("🔄 Performing fresh extraction");
      extractResult = await extractContent_v2(canonicalUrl);
      extractionCache.set(EX_KEY, { data: extractResult, timestamp: Date.now() });
    } else {
      console.log("📋 Using cached extraction");
    }

    // Analyze with Gemini only
    console.log(`🧠 Starting ${extractResult.status} analysis (Gemini)`);
    const unified = await analyzeWithLLM(
      extractResult.content,
      canonicalUrl,
      extractResult.meta.title,
      extractResult.status === "limited"
    );

    const legacy = mapUnifiedToLegacy(unified, extractResult);

    // Cache and return
    analysisCache.set(AN_KEY, { data: legacy, timestamp: Date.now() });
    console.log(`✅ Unified analysis completed in ${extractResult.status} mode`);
    return legacy;
  }
);
