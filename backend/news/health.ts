import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";

// Global secret definitions
const openaiKey = secret("OPENAI_API_KEY");
const geminiKey = secret("GEMINI_API_KEY");

// Health check endpoint to verify API configurations
export const healthCheck = api(
  { expose: true, method: "GET", path: "/news/health" },
  async () => {
    
    const openaiConfigured = !!(openaiKey && openaiKey());
    const geminiConfigured = !!(geminiKey && geminiKey());
    
    // Check package availability
    let packagesAvailable = {
      openai: false,
      gemini: false
    };
    
    try {
      await import("openai");
      packagesAvailable.openai = true;
    } catch (error) {
      console.warn("OpenAI package not available:", error);
    }
    
    try {
      await import("@google/generative-ai");
      packagesAvailable.gemini = true;
    } catch (error) {
      console.warn("Google Generative AI package not available:", error);
    }
    
    const status = openaiConfigured || geminiConfigured ? "healthy" : "degraded";
    
    return {
      status,
      timestamp: new Date().toISOString(),
      llm_providers: {
        openai: {
          configured: openaiConfigured,
          package_available: packagesAvailable.openai,
          ready: openaiConfigured && packagesAvailable.openai
        },
        gemini: {
          configured: geminiConfigured,
          package_available: packagesAvailable.gemini,
          ready: geminiConfigured && packagesAvailable.gemini
        }
      },
      fallback_available: (openaiConfigured && packagesAvailable.openai) || (geminiConfigured && packagesAvailable.gemini),
      dual_provider_ready: (openaiConfigured && packagesAvailable.openai) && (geminiConfigured && packagesAvailable.gemini),
      environment: {
        llm_order: process.env.LLM_ORDER || "openai,gemini",
        openai_model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        gemini_model: process.env.GEMINI_MODEL || "gemini-1.5-flash"
      },
      setup_instructions: {
        openai: openaiConfigured ? "✅ Configured" : "Add OPENAI_API_KEY to secrets",
        gemini: geminiConfigured ? "✅ Configured" : "Add GEMINI_API_KEY to secrets (get from https://makersuite.google.com/app/apikey)"
      }
    };
  }
);
