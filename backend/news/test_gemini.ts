import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

// Global secret definitions
const geminiApiKey = secret("GEMINI_API_KEY");
const openaiApiKey = secret("OPENAI_API_KEY");

// Test the Gemini API integration specifically
export const testGemini = api(
  { expose: true, method: "POST", path: "/test/gemini" },
  async ({ text = "This is a test article about climate change and renewable energy." }: { text?: string }) => {
    console.log("🧪 Testing Gemini API integration");
    
    const apiKey = geminiApiKey();
    
    if (!apiKey) {
      return {
        success: false,
        error: "GEMINI_API_KEY not configured in secrets",
        steps: [
          "1. Add GEMINI_API_KEY to Encore secrets",
          "2. Get API key from https://makersuite.google.com/app/apikey",
          "3. Ensure billing is enabled for the Google Cloud project"
        ]
      };
    }

    try {
      // Dynamic import to handle package availability
      let GoogleGenerativeAI: any;
      try {
        const geminiModule = await import("@google/generative-ai");
        GoogleGenerativeAI = geminiModule.GoogleGenerativeAI;
      } catch (importError) {
        return {
          success: false,
          error: "Google Generative AI package not available",
          details: String(importError),
          solution: "The @google/generative-ai package should be automatically installed by Leap"
        };
      }

      const client = new GoogleGenerativeAI(apiKey);
      const model = client.getGenerativeModel({ 
        model: "gemini-1.5-flash",
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1000,
        }
      });

      const startTime = Date.now();
      
      const prompt = `Analyze this text and return a JSON response with the following structure:
{
  "title": "Brief title for the content",
  "summary": "2-3 sentence summary",
  "bias": {
    "left_pct": 20,
    "center_pct": 60,
    "right_pct": 20,
    "note": "Brief explanation of bias analysis"
  },
  "sentiment": {
    "positive_pct": 40,
    "neutral_pct": 50,
    "negative_pct": 10,
    "note": "Brief explanation of sentiment"
  }
}

Text to analyze: ${text}`;

      console.log("📤 Sending request to Gemini...");
      
      const response = await Promise.race([
        model.generateContent(prompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error("Request timeout after 30 seconds")), 30000)
        )
      ]);

      const elapsed = Date.now() - startTime;
      const result = (response as any).response;
      
      if (!result) {
        throw new Error("No response object from Gemini");
      }

      const content = result.text();
      if (!content) {
        throw new Error("No text content in response");
      }

      console.log(`📥 Received response (${content.length} chars in ${elapsed}ms)`);

      // Try to parse as JSON
      let parsedResponse;
      try {
        // Clean up potential markdown formatting
        let cleanContent = content.trim();
        if (cleanContent.startsWith('```json')) {
          cleanContent = cleanContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        }
        if (cleanContent.startsWith('```')) {
          cleanContent = cleanContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        parsedResponse = JSON.parse(cleanContent);
      } catch (parseError) {
        console.log("⚠️ Failed to parse as JSON, returning raw response");
        parsedResponse = { raw_response: content };
      }

      return {
        success: true,
        elapsed_ms: elapsed,
        model: "gemini-1.5-flash",
        response: parsedResponse,
        raw_content: content.substring(0, 500) + (content.length > 500 ? "..." : ""),
        api_key_configured: true,
        package_available: true
      };

    } catch (error: any) {
      console.error("❌ Gemini test failed:", error);
      
      return {
        success: false,
        error: error.message || String(error),
        api_key_configured: !!apiKey,
        package_available: true,
        troubleshooting: [
          "Check if GEMINI_API_KEY is valid",
          "Ensure billing is enabled in Google Cloud Console",
          "Verify API quotas and limits",
          "Check if Gemini API is available in your region"
        ]
      };
    }
  }
);

// Test both OpenAI and Gemini in sequence
export const testBothProviders = api(
  { expose: true, method: "POST", path: "/test/both-llms" },
  async ({ text = "Climate change summit reaches historic agreement on renewable energy transition." }: { text?: string }) => {
    console.log("🧪 Testing both LLM providers");
    
    const results = {
      openai: null as any,
      gemini: null as any,
      comparison: null as any
    };

    // Test OpenAI
    try {
      const openaiApiKeyValue = openaiApiKey();
      if (openaiApiKeyValue) {
        const OpenAI = (await import("openai")).default;
        const client = new OpenAI({ apiKey: openaiApiKeyValue });
        
        const startTime = Date.now();
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          temperature: 0.3,
          max_tokens: 500,
          messages: [
            { role: "system", content: "Analyze the given text and return a brief JSON summary with title, summary, and sentiment." },
            { role: "user", content: text }
          ]
        });
        
        results.openai = {
          success: true,
          elapsed_ms: Date.now() - startTime,
          model: "gpt-4o-mini",
          response: response.choices[0]?.message?.content || "",
          usage: response.usage
        };
      } else {
        results.openai = { success: false, error: "OPENAI_API_KEY not configured" };
      }
    } catch (error) {
      results.openai = { success: false, error: String(error) };
    }

    // Test Gemini
    try {
      const geminiResult = await testGemini.apply(null, [{ text }] as any);
      results.gemini = geminiResult;
    } catch (error) {
      results.gemini = { success: false, error: String(error) };
    }

    // Comparison
    results.comparison = {
      both_available: results.openai?.success && results.gemini?.success,
      openai_available: !!results.openai?.success,
      gemini_available: !!results.gemini?.success,
      recommendation: results.openai?.success && results.gemini?.success 
        ? "Both providers available - dual fallback working"
        : results.openai?.success 
        ? "Only OpenAI available - consider configuring Gemini for redundancy"
        : results.gemini?.success
        ? "Only Gemini available - consider configuring OpenAI for redundancy"
        : "No LLM providers configured - analysis will fail"
    };

    return results;
  }
);