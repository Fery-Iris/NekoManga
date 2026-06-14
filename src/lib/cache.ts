// Simple in-memory cache with TTL for serverless functions
// Prevents excessive scraping of mangaku.top

interface CacheEntry<T> {
  data: T;
  expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

const DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

export function getCache<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiry) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

export function setCache<T>(key: string, data: T, ttl: number = DEFAULT_TTL): void {
  // Limit cache size to prevent memory leaks in serverless
  if (cache.size > 500) {
    // Remove expired entries first
    const now = Date.now();
    for (const [k, v] of cache.entries()) {
      if (now > v.expiry) cache.delete(k);
    }
    // If still too large, clear oldest half
    if (cache.size > 400) {
      const keys = Array.from(cache.keys());
      keys.slice(0, 200).forEach(k => cache.delete(k));
    }
  }

  cache.set(key, {
    data,
    expiry: Date.now() + ttl,
  });
}
