import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import OpenAI from "openai";

interface AnalyzeRequest {
  url: string;
  site: string;
  title: string;
  byline: string | null;
  estReadMin: number;
  text: string;
}

interface AnalyzeResponse {
  limited?: boolean;
  reason?: string;
  advice?: string;
  meta?: {
    title: string;
    site: string;
    byline: string | null;
    readMinutes: number;
    tone: "factual" | "neutral" | "analytical" | "opinion" | "uncertain";
  };
  tldr?: string;
  eli5?: string;
  whyItMatters?: string[];
  keyPoints?: Array<{
    label: "fact" | "quote" | "number" | "timeline" | "stakeholder" | "context";
    text: string;
  }>;
  biasAnalysis?: {
    left: number;
    center: number;
    right: number;
    confidence: "low" | "medium" | "high";
    rationale: string;
  };
  sentiment?: {
    positive: number;
    neutral: number;
    negative: number;
    note: string;
  };
  perspectives?: Array<{
    title: string;
    bullets: string[];
  }>;
  commonGround?: string[];
  glossary?: Array<{
    term: string;
    definition: string;
  }>;
  followUps?: string[];
}

const openaiApiKey = secret("OpenAIKey");

function cleanTitle(title: string, site: string): string {
  let cleanTitle = title.trim();
  
  // Remove common domain suffixes from titles
  const patterns = [
    / - CNN$/i,
    / \| Reuters$/i,
    / \(AP\)$/i,
    / - Associated Press$/i,
    / - NPR$/i,
    / - BBC$/i,
    / - The Guardian$/i,
    / - Washington Post$/i,
    / - New York Times$/i,
    / - NBC News$/i,
    / - ABC News$/i,
    / - CBS News$/i,
    / - Fox News$/i,
    new RegExp(` - ${site}$`, 'i'),
    new RegExp(` \\| ${site}$`, 'i'),
    new RegExp(` \\(${site}\\)$`, 'i')
  ];
  
  for (const pattern of patterns) {
    cleanTitle = cleanTitle.replace(pattern, '');
  }
  
  return cleanTitle.trim();
}

export const analyze = api<AnalyzeRequest, AnalyzeResponse>(
  { expose: true, method: "POST", path: "/analyze" },
  async ({ url, site, title, byline, estReadMin, text }) => {
    console.log(`🧠 Starting analysis for: ${site} (${text.length} chars)`);
    
    // If text is too short, return limited response
    if (text.length < 800) {
      console.log(`❌ Text too short: ${text.length} chars`);
      return {
        limited: true,
        reason: "insufficient_text",
        advice: "Open the original article for full context. Some sites restrict automated access."
      };
    }
    
    // Check if OpenAI API key is configured
    const apiKey = openaiApiKey();
    if (!apiKey || apiKey.trim() === "") {
      console.log("❌ No OpenAI API key configured");
      return {
        limited: true,
        reason: "api_not_configured",
        advice: "Analysis service is not properly configured."
      };
    }

    const openaiClient = new OpenAI({ apiKey });
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    
    const systemPrompt = `YOU ARE: "Unspin Analyzer" — produce concise, neutral, bias-aware news analysis from provided article TEXT. Do not browse. Do not fabricate facts beyond the text. If evidence is insufficient, say so.

OUTPUT (STRICT JSON)
{
  "meta": {
    "title": string,
    "site": string,
    "byline": string|null,
    "readMinutes": number,
    "tone": "factual" | "neutral" | "analytical" | "opinion" | "uncertain"
  },
  "tldr": string,                                // 1–2 sentences
  "eli5": string,                                // explain like I'm 5 (1 short paragraph)
  "whyItMatters": string[],                      // 3–6 bullets, each 1 sentence
  "keyPoints": [                                 // 5–10 items with light labels
    { "label": "fact|quote|number|timeline|stakeholder|context",
      "text": string }
  ],
  "biasAnalysis": {
    "left": number, "center": number, "right": number, // 0–100 sum≈100
    "confidence": "low"|"medium"|"high",
    "rationale": string                               // 1–2 lines on indicators
  },
  "sentiment": {
    "positive": number, "neutral": number, "negative": number, // 0–100 sum≈100
    "note": string
  },
  "perspectives": [                 // Different Perspectives
    { "title": string, "bullets": string[] },        // e.g., "Supporters' view"
    { "title": string, "bullets": string[] }         // e.g., "Critics' view"
  ],
  "commonGround": string[],          // 2–4 points of overlap or shared facts
  "glossary": [ { "term": string, "definition": string } ],  // 4–8 items present in text
  "followUps": [ string ]            // 3–5 curious next questions
}

ANALYSIS RULES
• Base every claim on the provided text. If not present, don't assume.
• Compute bias by indicators in wording, sources cited, framing, placement of counter-arguments, quoted voices. The numbers must vary naturally; NEVER use fixed defaults like 33/34/33.
• Sentiment reflects article's valence (toward events, not your opinion).
• "Perspectives" contrasts reasonable stakeholder views (e.g., admin vs opposition; industry vs watchdog).
• Prefer short, concrete bullets; avoid verbosity and purple prose.
• If text is clearly partial (wire blurb, live blog stub), set confidence to "low" and explain briefly.

STYLE GUARDRAILS
• No emojis. No political labels slung casually. No moral language.
• Avoid the dashy "— so that …" construction that looks AI-ish.
• Keep "tldr" extremely tight; "eli5" friendly and literal; "whyItMatters" skimmable.`;

    const userPrompt = `Summarize and analyze this article for a consumer app. Follow the schema exactly.

CRITICAL REQUIREMENTS:
- tldr: 1-2 tight sentences summarizing the core news
- eli5: 4-6 sentences, kid-friendly tone, explain the situation simply
- whyItMatters: 4-6 bullets explaining significance
- keyPoints: 6-10 bullets with labels from: fact, quote, number, timeline, stakeholder, context
- perspectives: 2 perspectives, each with title and 4+ bullets
- commonGround: 3 bullets showing shared agreements
- glossary: 5-8 items (ESL-friendly, avoid jargon)
- followUps: 3-5 questions as simple strings
- biasAnalysis: left/center/right integers must sum to 100, provide short rationale, vary based on content
- sentiment: positive/neutral/negative integers must sum to 100, non-static distribution

Title cleaning: Remove domain suffixes like "– CNN", "| Reuters", "(AP)" from title

Meta:
Site: ${site}
Original title: ${title}
Byline: ${byline || "unknown"}
Est read time: ${estReadMin} minutes
Word count: ${wordCount}

Article text:
${text}

Return JSON with all required fields. Ensure bias and sentiment numbers vary naturally based on content analysis, not fixed defaults.`;

    try {
      const response = await Promise.race([
        openaiClient.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 2500,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt },
          ],
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 30000))
      ]);

      const responseText = (response as any).choices?.[0]?.message?.content ?? "";
      
      try {
        const analysis = JSON.parse(responseText);
        
        // Clean the title
        if (analysis.meta && analysis.meta.title) {
          analysis.meta.title = cleanTitle(analysis.meta.title, site);
        }
        
        // Ensure numbers sum to 100
        if (analysis.biasAnalysis) {
          const biasTotal = analysis.biasAnalysis.left + analysis.biasAnalysis.center + analysis.biasAnalysis.right;
          if (biasTotal !== 100) {
            const scale = 100 / biasTotal;
            analysis.biasAnalysis.left = Math.round(analysis.biasAnalysis.left * scale);
            analysis.biasAnalysis.center = Math.round(analysis.biasAnalysis.center * scale);
            analysis.biasAnalysis.right = 100 - analysis.biasAnalysis.left - analysis.biasAnalysis.center;
          }
        }
        
        if (analysis.sentiment) {
          const sentTotal = analysis.sentiment.positive + analysis.sentiment.neutral + analysis.sentiment.negative;
          if (sentTotal !== 100) {
            const scale = 100 / sentTotal;
            analysis.sentiment.positive = Math.round(analysis.sentiment.positive * scale);
            analysis.sentiment.neutral = Math.round(analysis.sentiment.neutral * scale);
            analysis.sentiment.negative = 100 - analysis.sentiment.positive - analysis.sentiment.neutral;
          }
        }
        
        console.log(`✅ Analysis completed: ${wordCount} words, bias: ${analysis.biasAnalysis?.left}/${analysis.biasAnalysis?.center}/${analysis.biasAnalysis?.right}`);
        return analysis;
        
      } catch (parseError) {
        console.error(`❌ JSON parse error:`, parseError);
        return {
          limited: true,
          reason: "analysis_failed",
          advice: "The analysis service encountered an error processing this content."
        };
      }
      
    } catch (error: any) {
      console.error(`❌ OpenAI API error:`, error);
      
      // Handle specific OpenAI errors
      if (error?.message?.includes('429') || error?.message?.includes('rate_limit')) {
        return {
          limited: true,
          reason: "rate_limited",
          advice: "Analysis service is at capacity. Please try again in a few minutes."
        };
      }
      
      if (error?.message?.includes('timeout')) {
        return {
          limited: true,
          reason: "timeout",
          advice: "Analysis is taking too long. Please try again with a shorter article."
        };
      }
      
      return {
        limited: true,
        reason: "api_error",
        advice: "The analysis service is temporarily unavailable. Please try again later."
      };
    }
  }
);