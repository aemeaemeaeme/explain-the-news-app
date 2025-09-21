interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface CacheEntry {
  data: any;
  expiry: number;
}

class MemoryStore {
  private rateLimits = new Map<string, RateLimitEntry>();
  private cache = new Map<string, CacheEntry>();

  // Rate limiting: 3 requests per IP per day
  checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
    const now = Date.now();
    const dayStart = new Date().setHours(0, 0, 0, 0);
    const dayEnd = dayStart + 24 * 60 * 60 * 1000;
    
    const entry = this.rateLimits.get(ip);
    
    if (!entry || entry.resetTime < now) {
      // New day or first request
      this.rateLimits.set(ip, {
        count: 1,
        resetTime: dayEnd
      });
      return { allowed: true, remaining: 2, resetTime: dayEnd };
    }
    
    if (entry.count >= 3) {
      return { allowed: false, remaining: 0, resetTime: entry.resetTime };
    }
    
    entry.count++;
    this.rateLimits.set(ip, entry);
    
    return { 
      allowed: true, 
      remaining: Math.max(0, 3 - entry.count), 
      resetTime: entry.resetTime 
    };
  }

  // Caching: Store extractions for 2 hours
  getCached(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() > entry.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  setCached(key: string, data: any, ttlMs: number = 2 * 60 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttlMs
    });
  }

  // Cleanup expired entries periodically
  cleanup(): void {
    const now = Date.now();
    
    // Clean rate limits
    for (const [ip, entry] of this.rateLimits.entries()) {
      if (entry.resetTime < now) {
        this.rateLimits.delete(ip);
      }
    }
    
    // Clean cache
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiry < now) {
        this.cache.delete(key);
      }
    }
  }
}

export const memoryStore = new MemoryStore();

// Cleanup every hour
setInterval(() => {
  memoryStore.cleanup();
}, 60 * 60 * 1000);