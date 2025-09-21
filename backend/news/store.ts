// backend/news/store.ts
import { CONFIG } from "./config";

interface RateLimitEntry {
  count: number;
  windowStart: number;   // epoch ms when current window started
}

interface CacheEntry<T = any> {
  data: T;
  expiry: number;        // epoch ms when this entry expires
}

class MemoryStore {
  private rateLimits = new Map<string, RateLimitEntry>();
  private cache = new Map<string, CacheEntry>();

  /**
   * Sliding/windowed rate limit per IP using CONFIG.RATE_LIMIT_*.
   * - Window length: CONFIG.RATE_LIMIT_WINDOW_MS (default 1h)
   * - Max requests:  CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR
   */
  checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = Number(CONFIG.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
    const maxReq = Number(CONFIG.RATE_LIMIT_REQUESTS_PER_HOUR) || 20;

    let entry = this.rateLimits.get(ip);

    // initialize / rotate window
    if (!entry || now - entry.windowStart >= windowMs) {
      entry = { count: 0, windowStart: now };
    }

    // can we allow this request?
    if (entry.count >= maxReq) {
      const resetTime = entry.windowStart + windowMs;
      this.rateLimits.set(ip, entry);
      return { allowed: false, remaining: 0, resetTime };
    }

    entry.count += 1;
    this.rateLimits.set(ip, entry);

    const remaining = Math.max(0, maxReq - entry.count);
    const resetTime = entry.windowStart + windowMs;

    return { allowed: true, remaining, resetTime };
  }

  /**
   * Get a cached value by key if not expired; otherwise null.
   */
  getCached<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    return entry.data as T;
  }

  /**
   * Set a cached value with TTL (defaults to CONFIG.CACHE_TTL_MS).
   */
  setCached<T = any>(key: string, data: T, ttlMs?: number): void {
    const ttl = typeof ttlMs === "number" ? ttlMs : (Number(CONFIG.CACHE_TTL_MS) || 10 * 60 * 1000);
    this.cache.set(key, { data, expiry: Date.now() + ttl });
  }

  /**
   * Explicitly remove a cached key.
   */
  deleteCached(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Housekeeping for expired cache entries and stale rate windows.
   */
  cleanup(): void {
    const now = Date.now();
    const windowMs = Number(CONFIG.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;

    // Clean rate limits (drop windows older than 2x window size to be safe)
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (now - entry.windowStart > windowMs * 2) {
        this.rateLimits.delete(ip);
      }
    }

    // Clean cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry <= now) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryStore = new MemoryStore();

// Cleanup cadence: pick the smaller of cache TTL and window size, minimum 5 minutes.
(function scheduleCleanup() {
  const minInterval = 5 * 60 * 1000;
  const windowMs = Number(CONFIG.RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000;
  const cacheTtl = Number(CONFIG.CACHE_TTL_MS) || 10 * 60 * 1000;
  const interval = Math.max(minInterval, Math.min(windowMs, cacheTtl));

  setInterval(() => memoryStore.cleanup(), interval);
})();
