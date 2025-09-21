import { secret } from "encore.dev/config";
import OpenAI from "openai";

// Dynamic import for Gemini to handle potential package issues
let GoogleGenerativeAI: any = null;
try {
  const geminiModule = require("@google/generative-ai");
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (error) {
  console.warn("Google Generative AI package not available:", error);
}

// Types for unified JSON response
export interface UnifiedAnalysisResponse {
  meta: {
    provider: "openai" | "gemini";
    model: string;
    elapsed_ms: number;
    site: string | null;
    url: string;
    status: "full" | "limited" | "error";
  };
  header: {
    title: string;
    byline: string | null;
    read_time_min: number | null;
    tone: "factual" | "neutral" | "mixed" | "opinion" | "unknown";
  };
  tldr: string;
  eli5: string;
  why_it_matters: string[];
  key_points: Array<{
    tag: "fact" | "timeline" | "numbers" | "stakeholders";
    text: string;
  }>;
  bias: {
    left_pct: number;
    center_pct: number;
    right_pct: number;
    confidence: "low" | "medium" | "high";
    note: string;
  };
  sentiment: {
    positive_pct: number;
    neutral_pct: number;
    negative_pct: number;
    note: string;
  };
  perspectives: {
    left_view: string[];
    center_view: string[];
    right_view: string[];
  };
  common_ground: string[];
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  errors: Array<{
    code: string;
    message: string;
  }>;
}

// Configuration
const openaiApiKey = secret("OPENAI_API_KEY");
const geminiApiKey = secret("GEMINI_API_KEY");
const llmOrder = process.env.LLM_ORDER || "openai,gemini";

// Provider configuration
const PROVIDER_CONFIG = {
  openai: {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    timeout: 30000,
    retries: 1
  },
  gemini: {
    model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    timeout: 30000,
    retries: 1
  }
};

// Normalize numbers to sum to 100
function normalizeToHundred(a: number, b: number, c: number): [number, number, number] {
  const total = a + b + c;
  if (total === 0) return [0, 100, 0];
  
  const scale = 100 / total;
  const normA = Math.round(a * scale);
  const normB = Math.round(b * scale);
  const normC = 100 - normA - normB;
  
  return [Math.max(0, normA), Math.max(0, normB), Math.max(0, normC)];
}

// Validate and fix response structure
function validateResponse(response: any, provider: string): UnifiedAnalysisResponse | null {
  try {
    if (!response || typeof response !== 'object') return null;

    // Normalize bias percentages
    const biasLeft = Math.max(0, Math.min(100, Number(response.bias?.left_pct || response.bias?.left || 33)));
    const biasCenter = Math.max(0, Math.min(100, Number(response.bias?.center_pct || response.bias?.center || 34)));
    const biasRight = Math.max(0, Math.min(100, Number(response.bias?.right_pct || response.bias?.right || 33)));
    const [normBiasLeft, normBiasCenter, normBiasRight] = normalizeToHundred(biasLeft, biasCenter, biasRight);

    // Normalize sentiment percentages
    const sentPos = Math.max(0, Math.min(100, Number(response.sentiment?.positive_pct || response.sentiment?.positive || 34)));
    const sentNeu = Math.max(0, Math.min(100, Number(response.sentiment?.neutral_pct || response.sentiment?.neutral || 33)));
    const sentNeg = Math.max(0, Math.min(100, Number(response.sentiment?.negative_pct || response.sentiment?.negative || 33)));
    const [normSentPos, normSentNeu, normSentNeg] = normalizeToHundred(sentPos, sentNeu, sentNeg);

    return {
      meta: {
        provider: provider as "openai" | "gemini",
        model: response.meta?.model || PROVIDER_CONFIG[provider as keyof typeof PROVIDER_CONFIG].model,
        elapsed_ms: response.meta?.elapsed_ms || 0,
        site: response.meta?.site || null,
        url: response.meta?.url || "",
        status: response.meta?.status || "full"
      },
      header: {
        title: String(response.header?.title || response.title || "Untitled"),
        byline: response.header?.byline || response.byline || null,
        read_time_min: Number(response.header?.read_time_min || response.read_time_min) || null,
        tone: response.header?.tone || response.tone || "unknown"
      },
      tldr: String(response.tldr || "Summary not available"),
      eli5: String(response.eli5 || "Simplified explanation not available"),
      why_it_matters: Array.isArray(response.why_it_matters) ? response.why_it_matters.slice(0, 6) : [],
      key_points: Array.isArray(response.key_points) ? response.key_points.slice(0, 10).map((point: any) => ({
        tag: ["fact", "timeline", "numbers", "stakeholders"].includes(point.tag) ? point.tag : "fact",
        text: String(point.text || "")
      })).filter((p: any) => p.text) : [],
      bias: {
        left_pct: normBiasLeft,
        center_pct: normBiasCenter,
        right_pct: normBiasRight,
        confidence: response.bias?.confidence || "medium",
        note: String(response.bias?.note || response.bias?.rationale || "Analysis based on content framing")
      },
      sentiment: {
        positive_pct: normSentPos,
        neutral_pct: normSentNeu,
        negative_pct: normSentNeg,
        note: String(response.sentiment?.note || response.sentiment?.rationale || "Based on language and tone analysis")
      },
      perspectives: {
        left_view: Array.isArray(response.perspectives?.left_view) ? response.perspectives.left_view.slice(0, 5) : [],
        center_view: Array.isArray(response.perspectives?.center_view) ? response.perspectives.center_view.slice(0, 5) : [],
        right_view: Array.isArray(response.perspectives?.right_view) ? response.perspectives.right_view.slice(0, 5) : []
      },
      common_ground: Array.isArray(response.common_ground) ? response.common_ground.slice(0, 4) : [],
      glossary: Array.isArray(response.glossary) ? response.glossary.slice(0, 8).map((item: any) => ({
        term: String(item.term || ""),
        definition: String(item.definition || "")
      })).filter((g: any) => g.term && g.definition) : [],
      errors: Array.isArray(response.errors) ? response.errors : []
    };
  } catch (error) {
    console.error("Response validation failed:", error);
    return null;
  }
}

// OpenAI provider
async function callOpenAI(prompt: string, articleData: any): Promise<UnifiedAnalysisResponse | null> {
  const apiKey = openaiApiKey();
  if (!apiKey) throw new Error("OpenAI API key not configured");

  const client = new OpenAI({ apiKey });
  const startTime = Date.now();

  try {
    const response = await Promise.race([
      client.chat.completions.create({
        model: PROVIDER_CONFIG.openai.model,
        temperature: 0.3,
        max_tokens: 2500,
        messages: [
          { role: "system", content: prompt },
          { role: "user", content: JSON.stringify(articleData) }
        ]
      }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("OpenAI timeout")), PROVIDER_CONFIG.openai.timeout)
      )
    ]);

    const content = (response as any).choices?.[0]?.message?.content;
    if (!content) throw new Error("No content in OpenAI response");

    const parsed = JSON.parse(content);
    const validated = validateResponse(parsed, "openai");
    
    if (validated) {
      validated.meta.elapsed_ms = Date.now() - startTime;
      return validated;
    }
    
    throw new Error("OpenAI response validation failed");
  } catch (error) {
    console.error("OpenAI call failed:", error);
    throw error;
  }
}

// Gemini provider
async function callGemini(prompt: string, articleData: any): Promise<UnifiedAnalysisResponse | null> {
  // Check if Gemini package is available
  if (!GoogleGenerativeAI) {
    throw new Error("Google Generative AI package not available");
  }

  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("Gemini API key not configured");

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ 
      model: PROVIDER_CONFIG.gemini.model,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 2500,
      }
    });
    
    const startTime = Date.now();
    const fullPrompt = `${prompt}\n\nArticle data: ${JSON.stringify(articleData)}`;
    
    console.log(`🤖 Calling Gemini with model: ${PROVIDER_CONFIG.gemini.model}`);
    
    const response = await Promise.race([
      model.generateContent(fullPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_CONFIG.gemini.timeout)
      )
    ]);

    const result = (response as any).response;
    if (!result) throw new Error("No response from Gemini");

    const content = result.text();
    if (!content) throw new Error("No text content in Gemini response");

    console.log(`📝 Gemini response length: ${content.length} characters`);

    // Clean up the response - sometimes Gemini adds markdown formatting
    let cleanContent = content.trim();
    if (cleanContent.startsWith('```json')) {
      cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (cleanContent.startsWith('```')) {
      cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(cleanContent);
    const validated = validateResponse(parsed, "gemini");
    
    if (validated) {
      validated.meta.elapsed_ms = Date.now() - startTime;
      validated.meta.model = PROVIDER_CONFIG.gemini.model;
      console.log(`✅ Gemini analysis completed in ${validated.meta.elapsed_ms}ms`);
      return validated;
    }
    
    throw new Error("Gemini response validation failed");
  } catch (error) {
    console.error("Gemini call failed:", error);
    throw error;
  }
}

// Create system prompt for analysis
function createSystemPrompt(isLimited: boolean): string {
  return `You are an impartial news analysis assistant. Analyze the provided article and return ONLY valid JSON matching this exact schema:

{
  "header": {
    "title": "string",
    "byline": "string|null",
    "read_time_min": number,
    "tone": "factual|neutral|mixed|opinion|unknown"
  },
  "tldr": "1-2 sentence summary",
  "eli5": "Simple explanation for general audience",
  "why_it_matters": ["bullet1", "bullet2", ...],
  "key_points": [{"tag": "fact|timeline|numbers|stakeholders", "text": "point"}],
  "bias": {
    "left_pct": 0-100,
    "center_pct": 0-100, 
    "right_pct": 0-100,
    "confidence": "low|medium|high",
    "note": "explanation"
  },
  "sentiment": {
    "positive_pct": 0-100,
    "neutral_pct": 0-100,
    "negative_pct": 0-100,
    "note": "explanation"
  },
  "perspectives": {
    "left_view": ["bullet1", "bullet2"],
    "center_view": ["bullet1", "bullet2"],
    "right_view": ["bullet1", "bullet2"]
  },
  "common_ground": ["shared point1", "shared point2"],
  "glossary": [{"term": "term", "definition": "definition"}]
}

CRITICAL RULES:
- bias and sentiment percentages must sum to 100
- Never fabricate quotes or specific details not in the text
- Use varied, realistic percentages based on actual content analysis
- If limited extraction, state uncertainties clearly
${isLimited ? "- Note that full article text was not available; analysis is based on limited content" : ""}
- Return ONLY the JSON, no additional text`;
}

// Main router function
export async function analyzeWithLLM(
  articleText: string,
  url: string,
  title: string,
  isLimited: boolean = false
): Promise<UnifiedAnalysisResponse> {
  const providers = llmOrder.split(",").map(p => p.trim()) as ("openai" | "gemini")[];
  const systemPrompt = createSystemPrompt(isLimited);
  const articleData = {
    url,
    title,
    text: articleText,
    word_count: articleText.split(/\s+/).length,
    limited: isLimited
  };

  const errors: Array<{ code: string; message: string }> = [];

  for (const provider of providers) {
    for (let attempt = 0; attempt <= PROVIDER_CONFIG[provider].retries; attempt++) {
      try {
        console.log(`🤖 Attempting ${provider} (attempt ${attempt + 1})`);
        
        let result: UnifiedAnalysisResponse | null = null;
        
        if (provider === "openai") {
          result = await callOpenAI(systemPrompt, articleData);
        } else if (provider === "gemini") {
          result = await callGemini(systemPrompt, articleData);
        }

        if (result) {
          result.meta.url = url;
          result.meta.site = new URL(url).hostname;
          result.meta.status = isLimited ? "limited" : "full";
          result.errors = errors;
          
          console.log(`✅ ${provider} analysis completed (${result.meta.elapsed_ms}ms)`);
          return result;
        }
      } catch (error: any) {
        const errorMsg = error.message || String(error);
        console.error(`❌ ${provider} attempt ${attempt + 1} failed:`, errorMsg);
        
        errors.push({
          code: `${provider}_error`,
          message: errorMsg
        });

        if (attempt < PROVIDER_CONFIG[provider].retries) {
          const backoffMs = Math.pow(2, attempt) * 1000;
          await new Promise(resolve => setTimeout(resolve, backoffMs));
        }
      }
    }
  }

  // All providers failed - return error response
  console.error("🚨 All LLM providers failed");
  
  return {
    meta: {
      provider: "openai",
      model: "error",
      elapsed_ms: 0,
      site: new URL(url).hostname,
      url,
      status: "error"
    },
    header: {
      title: title || "Analysis Failed",
      byline: null,
      read_time_min: null,
      tone: "unknown"
    },
    tldr: "Analysis service temporarily unavailable. All LLM providers failed to process this content.",
    eli5: "Our analysis systems are having trouble right now. Please try again later or visit the original article.",
    why_it_matters: [
      "Service reliability is important for consistent user experience",
      "Multiple provider fallbacks help ensure availability",
      "Original source remains the authoritative reference"
    ],
    key_points: [
      { tag: "fact", text: "LLM analysis services are currently unavailable" },
      { tag: "timeline", text: "Multiple providers failed during processing" },
      { tag: "stakeholders", text: "Users should visit original source for content" }
    ],
    bias: {
      left_pct: 0,
      center_pct: 100,
      right_pct: 0,
      confidence: "low",
      note: "Cannot analyze bias without successful content processing"
    },
    sentiment: {
      positive_pct: 0,
      neutral_pct: 100,
      negative_pct: 0,
      note: "Cannot analyze sentiment without successful content processing"
    },
    perspectives: {
      left_view: [],
      center_view: ["Service reliability challenges affect all users equally"],
      right_view: []
    },
    common_ground: [
      "Users expect reliable analysis services",
      "Original sources remain most authoritative",
      "Technical challenges require robust fallback systems"
    ],
    glossary: [
      { term: "LLM", definition: "Large Language Model - AI system used for text analysis" },
      { term: "Provider fallback", definition: "Using backup services when primary systems fail" },
      { term: "Analysis timeout", definition: "When processing takes too long and is cancelled" }
    ],
    errors
  };
}