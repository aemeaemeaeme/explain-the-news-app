// Environment configuration for the UNSPIN system (Gemini-only)

export const CONFIG = {
  // LLM Provider configuration (Gemini is the only provider)
  LLM_ORDER: "gemini" as const,
  GEMINI_MODEL: process.env.GEMINI_MODEL || "gemini-1.5-flash",

  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_HOUR: parseInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR || "20"),
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || "3600000"), // 1 hour

  // Caching
  CACHE_TTL_MS: parseInt(process.env.CACHE_TTL_MS || "600000"), // 10 minutes

  // Extraction settings
  EXTRACTION_TIMEOUT_MS: parseInt(process.env.EXTRACTION_TIMEOUT_MS || "15000"), // 15 seconds
  EXTRACTION_MIN_CHARS: parseInt(process.env.EXTRACTION_MIN_CHARS || "800"),
  EXTRACTION_RETRIES: parseInt(process.env.EXTRACTION_RETRIES || "2"),

  // LLM settings
  LLM_TIMEOUT_MS: parseInt(process.env.LLM_TIMEOUT_MS || "30000"), // 30 seconds
  LLM_RETRIES: parseInt(process.env.LLM_RETRIES || "1"),

  // Feature flags
  ENABLE_ROBOTS_TXT_CHECK: process.env.ENABLE_ROBOTS_TXT_CHECK !== "false", // Default true
  ENABLE_PUBLIC_API_SOURCES: process.env.ENABLE_PUBLIC_API_SOURCES === "true", // Default false
  ENABLE_HEADLESS_BROWSER: process.env.ENABLE_HEADLESS_BROWSER === "true", // Default false

  // External services (optional)
  GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY || "",
  NYT_API_KEY: process.env.NYT_API_KEY || "",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_EXTRACTION_DETAILS: process.env.LOG_EXTRACTION_DETAILS === "true",
  LOG_LLM_RESPONSES: process.env.LOG_LLM_RESPONSES === "true",
} as const;

// Validation function
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR < 1 || CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR > 1000) {
    errors.push("RATE_LIMIT_REQUESTS_PER_HOUR must be between 1 and 1000");
  }

  if (CONFIG.CACHE_TTL_MS < 0 || CONFIG.CACHE_TTL_MS > 86400000) {
    errors.push("CACHE_TTL_MS must be between 0 and 86400000 (24 hours)");
  }

  if (CONFIG.EXTRACTION_TIMEOUT_MS < 5000 || CONFIG.EXTRACTION_TIMEOUT_MS > 60000) {
    errors.push("EXTRACTION_TIMEOUT_MS must be between 5000 and 60000");
  }

  if (CONFIG.LLM_TIMEOUT_MS < 10000 || CONFIG.LLM_TIMEOUT_MS > 120000) {
    errors.push("LLM_TIMEOUT_MS must be between 10000 and 120000");
  }

  // LLM_ORDER is now fixed to 'gemini' so no validation needed here.

  return errors;
}

// Configuration summary for logging
export function getConfigSummary(): Record<string, any> {
  return {
    llm_provider: CONFIG.LLM_ORDER,                // 'gemini'
    gemini_model: CONFIG.GEMINI_MODEL,
    rate_limit_per_hour: CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR,
    cache_ttl_minutes: Math.round(CONFIG.CACHE_TTL_MS / 60000),
    extraction_timeout_seconds: Math.round(CONFIG.EXTRACTION_TIMEOUT_MS / 1000),
    llm_timeout_seconds: Math.round(CONFIG.LLM_TIMEOUT_MS / 1000),
    robots_txt_check: CONFIG.ENABLE_ROBOTS_TXT_CHECK,
    public_api_sources: CONFIG.ENABLE_PUBLIC_API_SOURCES,
    headless_browser: CONFIG.ENABLE_HEADLESS_BROWSER,
    guardian_api_configured: !!CONFIG.GUARDIAN_API_KEY,
    nyt_api_configured: !!CONFIG.NYT_API_KEY,
  };
}
