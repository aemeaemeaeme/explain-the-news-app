import { secret } from "encore.dev/config";
import OpenAI from "openai";

// Dynamic import for Gemini
let GoogleGenerativeAI: any = null;
try {
  const geminiModule = require("@google/generative-ai");
  GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
} catch (error) {
  console.warn("Google Generative AI package not available:", error);
}

// Updated contract schema
export interface AnalysisResponse {
  status: "full" | "limited";
  meta: {
    title: string;
    source: string;
    author: string | null;
    published: string | null;
    reading_minutes: number;
    tone: "factual" | "analytical" | "opinion" | "mixed";
    provider: "gemini" | "openai";
    model: string;
    fallback_used: boolean;
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
  glossary: Array<{
    term: string;
    definition: string;
  }>;
  followups: string[];
  processing_notes: string[];
}

// Configuration
const openaiApiKey = secret("OPENAI_API_KEY");
const geminiApiKey = secret("GEMINI_API_KEY");

const PROVIDER_CONFIG = {
  gemini: {
    model_fast: "gemini-1.5-flash",
    model_pro: "gemini-1.5-pro",
    timeout: 30000,
    retries: 1
  },
  openai: {
    model: "gpt-4o-mini",
    timeout: 30000,
    retries: 1
  }
};

// Normalize percentages to sum to 100
function normalizeToHundred(a: number, b: number, c: number): [number, number, number] {
  const total = a + b + c;
  if (total === 0) return [33, 34, 33];
  
  const scale = 100 / total;
  const normA = Math.round(a * scale);
  const normB = Math.round(b * scale);
  const normC = 100 - normA - normB;
  
  return [Math.max(0, normA), Math.max(0, normB), Math.max(0, normC)];
}

// Create system prompt for unified output
function createSystemPrompt(mode: "full" | "limited"): string {
  return `You are Unspin, a neutral news explainer. Given either (a) full article text + metadata or (b) only headline/metadata (limited mode), produce a structured JSON that exactly matches the provided schema.

Rules:
- No fabrication. If in limited mode, never infer internal details; keep analysis generic and clearly note limitations.
- Tone: concise, clear, non-partisan. Prefer plain language.
- Sections required: tldr, eli5, why_it_matters (2–5 bullets), key_points (5–10 items with tags), bias_analysis (left/center/right percentages + a one-line rationale), sentiment (pos/neu/neg + one-line note), perspectives (representative takes across spectrum), common_ground (what most sides can agree on), glossary (5–8 short defs), followups (3–5 curious next questions).
- Bias & sentiment: when full content is present, ground in quotes, claims, or framing; when limited, keep values conservative and mark confidence "low".
- Output only JSON matching the schema; don't include explanations outside fields.
${mode === "limited" ? "- Note that full article text was not available; analysis is based on metadata only" : ""}

EXACT JSON SCHEMA:
{
  "tldr": "string",
  "eli5": "string", 
  "why_it_matters": ["string", "..."],
  "key_points": [
    {"tag":"fact|numbers|timeline|stakeholders|quote","text":"string"}
  ],
  "bias_analysis": {
    "left": 0-100, "center": 0-100, "right": 0-100, "confidence": "low|med|high",
    "notes": "string"
  },
  "sentiment": {"positive":0-100,"neutral":0-100,"negative":0-100,"notes":"string"},
  "perspectives": {
    "left_view": ["string"], "center_view": ["string"], "right_view": ["string"]
  },
  "common_ground": ["string", "..."],
  "glossary": [{"term":"string","definition":"string"}],
  "followups": ["string","..."]
}

You may be run on Google Gemini (primary) or OpenAI (fallback); your output must match the exact JSON schema regardless of provider.`;
}

// Choose appropriate Gemini model
function chooseGeminiModel(textLength: number, isLimited: boolean): string {
  if (isLimited) {
    return PROVIDER_CONFIG.gemini.model_fast; // Always use flash for limited mode
  }
  
  // Use pro for complex/long content
  if (textLength > 6000) {
    return PROVIDER_CONFIG.gemini.model_pro;
  }
  
  return PROVIDER_CONFIG.gemini.model_fast;
}

// Gemini provider call
async function callGemini(
  prompt: string, 
  articleData: any, 
  isLimited: boolean
): Promise<any> {
  if (!GoogleGenerativeAI) {
    throw new Error("Google Generative AI package not available");
  }

  const apiKey = geminiApiKey();
  if (!apiKey) {
    throw new Error("Gemini API key not configured");
  }

  const textLength = articleData.content?.length || 0;
  const modelToUse = chooseGeminiModel(textLength, isLimited);
  
  console.log(`🤖 Calling Gemini with model: ${modelToUse}`);

  try {
    const client = new GoogleGenerativeAI(apiKey);
    const model = client.getGenerativeModel({ 
      model: modelToUse,
      generationConfig: {
        temperature: isLimited ? 0.0 : 0.2,
        maxOutputTokens: isLimited ? 1500 : 2500,
      }
    });
    
    const fullPrompt = `${prompt}\n\nArticle data: ${JSON.stringify(articleData)}`;
    
    const response = await Promise.race([
      model.generateContent(fullPrompt),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error("Gemini timeout")), PROVIDER_CONFIG.gemini.timeout)
      )
    ]);

    const result = (response as any).response;
    if (!result) throw new Error("No response from Gemini");

    let content = result.text();
    if (!content) throw new Error("No text content in Gemini response");

    // Clean up markdown formatting that Gemini sometimes adds
    content = content.trim();
    if (content.startsWith('```json')) {
      content = content.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    }
    if (content.startsWith('```')) {
      content = content.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    const parsed = JSON.parse(content);
    
    // Normalize percentages
    if (parsed.bias_analysis) {
      const [left, center, right] = normalizeToHundred(
        parsed.bias_analysis.left || 33,
        parsed.bias_analysis.center || 34, 
        parsed.bias_analysis.right || 33
      );
      parsed.bias_analysis.left = left;
      parsed.bias_analysis.center = center;
      parsed.bias_analysis.right = right;
    }
    
    if (parsed.sentiment) {
      const [positive, neutral, negative] = normalizeToHundred(
        parsed.sentiment.positive || 33,
        parsed.sentiment.neutral || 34,
        parsed.sentiment.negative || 33
      );
      parsed.sentiment.positive = positive;
      parsed.sentiment.neutral = neutral;
      parsed.sentiment.negative = negative;
    }
    
    return { parsed, model: modelToUse };
  } catch (error: any) {
    console.error("Gemini call failed:", error);
    throw error;
  }
}

// OpenAI provider call
async function callOpenAI(prompt: string, articleData: any, isLimited: boolean): Promise<any> {
  const apiKey = openaiApiKey();
  if (!apiKey) {
    throw new Error("OpenAI API key not configured");
  }

  console.log(`🤖 Calling OpenAI with model: ${PROVIDER_CONFIG.openai.model}`);

  try {
    const client = new OpenAI({ apiKey });
    
    const response = await Promise.race([
      client.chat.completions.create({
        model: PROVIDER_CONFIG.openai.model,
        temperature: isLimited ? 0.0 : 0.2,
        max_tokens: isLimited ? 1500 : 2500,
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
    
    // Normalize percentages
    if (parsed.bias_analysis) {
      const [left, center, right] = normalizeToHundred(
        parsed.bias_analysis.left || 33,
        parsed.bias_analysis.center || 34,
        parsed.bias_analysis.right || 33
      );
      parsed.bias_analysis.left = left;
      parsed.bias_analysis.center = center;
      parsed.bias_analysis.right = right;
    }
    
    if (parsed.sentiment) {
      const [positive, neutral, negative] = normalizeToHundred(
        parsed.sentiment.positive || 33,
        parsed.sentiment.neutral || 34,
        parsed.sentiment.negative || 33
      );
      parsed.sentiment.positive = positive;
      parsed.sentiment.neutral = neutral;
      parsed.sentiment.negative = negative;
    }
    
    return { parsed, model: PROVIDER_CONFIG.openai.model };
  } catch (error: any) {
    console.error("OpenAI call failed:", error);
    throw error;
  }
}

// Main analysis function
export async function analyzeWithProviders(
  extractResult: {
    status: "full" | "limited";
    meta: any;
    content: string;
    processing_notes: string[];
  }
): Promise<AnalysisResponse> {
  const startTime = Date.now();
  const isLimited = extractResult.status === "limited";
  const systemPrompt = createSystemPrompt(extractResult.status);
  
  const articleData = {
    mode: extractResult.status,
    meta: extractResult.meta,
    content: extractResult.content
  };

  const errors: string[] = [];
  let fallbackUsed = false;

  // Primary: Gemini
  try {
    console.log('🔮 Attempting Gemini analysis (primary)');
    
    const result = await callGemini(systemPrompt, articleData, isLimited);
    
    console.log(`✅ Gemini analysis completed with ${result.model}`);
    
    return {
      ...result.parsed,
      status: extractResult.status,
      meta: {
        ...extractResult.meta,
        provider: "gemini",
        model: result.model,
        fallback_used: false
      },
      processing_notes: [...extractResult.processing_notes, `Analyzed with Gemini ${result.model}`]
    };
  } catch (error: any) {
    console.error('❌ Gemini analysis failed:', error.message);
    errors.push(`Gemini: ${error.message}`);
  }

  // Fallback: OpenAI  
  try {
    console.log('🔄 Falling back to OpenAI');
    fallbackUsed = true;
    
    const result = await callOpenAI(systemPrompt, articleData, isLimited);
    
    console.log(`✅ OpenAI fallback analysis completed`);
    
    return {
      ...result.parsed,
      status: extractResult.status,
      meta: {
        ...extractResult.meta,
        provider: "openai",
        model: result.model,
        fallback_used: true
      },
      processing_notes: [
        ...extractResult.processing_notes, 
        `Gemini failed, used OpenAI ${result.model} as fallback`
      ]
    };
  } catch (error: any) {
    console.error('❌ OpenAI fallback failed:', error.message);
    errors.push(`OpenAI: ${error.message}`);
  }

  // Both providers failed
  console.error('🚨 All providers failed');
  
  return {
    status: "limited",
    meta: {
      ...extractResult.meta,
      provider: "openai",
      model: "error",
      fallback_used: true
    },
    tldr: "Analysis service temporarily unavailable. All AI providers failed to process this content.",
    eli5: "Our analysis systems are having trouble right now. Please try again later or visit the original article.",
    why_it_matters: [
      "Service reliability is important for consistent user experience",
      "Multiple provider fallbacks help ensure availability"
    ],
    key_points: [
      { tag: "fact", text: "AI analysis services are currently unavailable" },
      { tag: "timeline", text: "Multiple providers failed during processing" }
    ],
    bias_analysis: {
      left: 0,
      center: 100,
      right: 0,
      confidence: "low",
      notes: "Cannot analyze bias without successful content processing"
    },
    sentiment: {
      positive: 0,
      neutral: 100,
      negative: 0,
      notes: "Cannot analyze sentiment without successful content processing"
    },
    perspectives: {
      left_view: [],
      center_view: ["Service reliability challenges affect all users equally"],
      right_view: []
    },
    common_ground: [
      "Users expect reliable analysis services",
      "Original sources remain most authoritative"
    ],
    glossary: [
      { term: "AI Analysis", definition: "Automated text processing using machine learning models" },
      { term: "Provider fallback", definition: "Using backup services when primary systems fail" }
    ],
    followups: [
      "What caused the analysis systems to fail?",
      "When will the service be restored?",
      "How can I get the content analyzed manually?"
    ],
    processing_notes: [
      ...extractResult.processing_notes,
      "All AI providers failed",
      `Errors: ${errors.join('; ')}`
    ]
  };
}