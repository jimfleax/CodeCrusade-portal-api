interface CacheItem<T> {
  value: T;
  expiry: number;
}

export class InMemoryCache {
  private cache: Map<string, CacheItem<any>> = new Map();
  private maxItems: number;
  private defaultTTL: number;

  constructor(maxItems = 1000, defaultTTL = 60000) {
    this.maxItems = maxItems;
    this.defaultTTL = defaultTTL;
  }

  set(key: string, value: any, ttl?: number): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxItems) {
      // Remove first item (least recently used)
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    const expiry = Date.now() + (ttl ?? this.defaultTTL);
    this.cache.set(key, { value, expiry });
  }

  get<T = any>(key: string): T | undefined {
    const item = this.cache.get(key);
    if (!item) return undefined;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return undefined;
    }

    // Refresh LRU status
    this.cache.delete(key);
    this.cache.set(key, item);

    return item.value;
  }

  del(key: string): void {
    this.cache.delete(key);
  }

  delPattern(pattern: RegExp | string): void {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }
}

// Export a default instance for general use
export const cache = new InMemoryCache();
