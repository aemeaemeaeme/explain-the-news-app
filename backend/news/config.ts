// Environment configuration for the UNSPIN system (Gemini-only)

function toInt(env: string | undefined, fallback: number) {
  const n = Number(env);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
function toBool(env: string | undefined, fallback: boolean) {
  if (env == null) return fallback;
  const v = env.trim().toLowerCase();
  if (["1", "true", "yes", "y", "on"].includes(v)) return true;
  if (["0", "false", "no", "n", "off"].includes(v)) return false;
  return fallback;
}

export const CONFIG = {
  // LLM provider (fixed to Gemini)
  LLM_ORDER: "gemini" as const,

  // Models
  GEMINI_MODEL_FAST: process.env.GEMINI_MODEL_FAST || "gemini-1.5-flash",
  GEMINI_MODEL_PRO: process.env.GEMINI_MODEL_PRO || "gemini-1.5-pro",

  // Rate limiting
  RATE_LIMIT_REQUESTS_PER_HOUR: toInt(process.env.RATE_LIMIT_REQUESTS_PER_HOUR, 20),
  RATE_LIMIT_WINDOW_MS: toInt(process.env.RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),

  // Caching
  CACHE_TTL_MS: toInt(process.env.CACHE_TTL_MS, 10 * 60 * 1000),

  // Extraction settings (used by fetch.ts)
  EXTRACTION_TIMEOUT_MS: toInt(process.env.EXTRACTION_TIMEOUT_MS, 15000),
  EXTRACTION_MIN_CHARS: toInt(process.env.EXTRACTION_MIN_CHARS, 800),
  EXTRACTION_RETRIES: toInt(process.env.EXTRACTION_RETRIES, 2),

  // LLM settings (used by router.ts / analyze.ts / process.ts)
  LLM_TIMEOUT_MS: toInt(process.env.LLM_TIMEOUT_MS, 30000),
  LLM_RETRIES: toInt(process.env.LLM_RETRIES, 1),

  // Chunking limits (keep in sync with analyzers)
  LLM_CHUNK_CHARS: toInt(process.env.LLM_CHUNK_CHARS, 6000),
  LLM_FINAL_BUDGET_CHARS: toInt(process.env.LLM_FINAL_BUDGET_CHARS, 9500),

  // Feature flags
  ENABLE_ROBOTS_TXT_CHECK: toBool(process.env.ENABLE_ROBOTS_TXT_CHECK, true),
  ENABLE_PUBLIC_API_SOURCES: toBool(process.env.ENABLE_PUBLIC_API_SOURCES, false),
  ENABLE_HEADLESS_BROWSER: toBool(process.env.ENABLE_HEADLESS_BROWSER, false),

  // External services (optional)
  GUARDIAN_API_KEY: process.env.GUARDIAN_API_KEY || "",
  NYT_API_KEY: process.env.NYT_API_KEY || "",

  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  LOG_EXTRACTION_DETAILS: toBool(process.env.LOG_EXTRACTION_DETAILS, false),
  LOG_LLM_RESPONSES: toBool(process.env.LOG_LLM_RESPONSES, false),
} as const;

/** Choose Gemini model based on input length and whether it’s limited mode */
export function getGeminiModelFor(textLength: number, limited: boolean): string {
  if (limited) return CONFIG.GEMINI_MODEL_FAST;
  return textLength > CONFIG.LLM_CHUNK_CHARS ? CONFIG.GEMINI_MODEL_PRO : CONFIG.GEMINI_MODEL_FAST;
}

// Validation function
export function validateConfig(): string[] {
  const errors: string[] = [];

  if (CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR < 1 || CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR > 1000) {
    errors.push("RATE_LIMIT_REQUESTS_PER_HOUR must be between 1 and 1000");
  }
  if (CONFIG.CACHE_TTL_MS < 0 || CONFIG.CACHE_TTL_MS > 86_400_000) {
    errors.push("CACHE_TTL_MS must be between 0 and 86400000 (24 hours)");
  }
  if (CONFIG.EXTRACTION_TIMEOUT_MS < 5000 || CONFIG.EXTRACTION_TIMEOUT_MS > 60000) {
    errors.push("EXTRACTION_TIMEOUT_MS must be between 5000 and 60000");
  }
  if (CONFIG.LLM_TIMEOUT_MS < 10000 || CONFIG.LLM_TIMEOUT_MS > 120000) {
    errors.push("LLM_TIMEOUT_MS must be between 10000 and 120000");
  }

  return errors;
}

// Configuration summary for logging
export function getConfigSummary(): Record<string, any> {
  return {
    llm_provider: CONFIG.LLM_ORDER,                // 'gemini'
    gemini_model_fast: CONFIG.GEMINI_MODEL_FAST,
    gemini_model_pro: CONFIG.GEMINI_MODEL_PRO,
    rate_limit_per_hour: CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR,
    cache_ttl_minutes: Math.round(CONFIG.CACHE_TTL_MS / 60000),
    extraction_timeout_seconds: Math.round(CONFIG.EXTRACTION_TIMEOUT_MS / 1000),
    llm_timeout_seconds: Math.round(CONFIG.LLM_TIMEOUT_MS / 1000),
    chunk_chars: CONFIG.LLM_CHUNK_CHARS,
    final_budget_chars: CONFIG.LLM_FINAL_BUDGET_CHARS,
    robots_txt_check: CONFIG.ENABLE_ROBOTS_TXT_CHECK,
    public_api_sources: CONFIG.ENABLE_PUBLIC_API_SOURCES,
    headless_browser: CONFIG.ENABLE_HEADLESS_BROWSER,
    guardian_api_configured: !!CONFIG.GUARDIAN_API_KEY,
    nyt_api_configured: !!CONFIG.NYT_API_KEY,
  };
}
