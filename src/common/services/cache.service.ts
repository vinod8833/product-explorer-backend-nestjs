import { Injectable } from '@nestjs/common';

interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

@Injectable()
export class CacheService {
  private cache = new Map<string, { value: any; expires: number; tags: string[] }>();

  async get<T>(key: string, options?: { ttl?: number; tags?: string[]; fallback?: () => Promise<T> }): Promise<T | null> {
    const cached = this.cache.get(key);
    
    if (cached && cached.expires > Date.now()) {
      return cached.value;
    }

    if (options?.fallback) {
      const value = await options.fallback();
      await this.set(key, value, { ttl: options.ttl, tags: options.tags });
      return value;
    }

    return null;
  }

  async set(key: string, value: any, options?: CacheOptions): Promise<void> {
    const ttl = options?.ttl || 300; // 5 minutes default
    const expires = Date.now() + (ttl * 1000);
    const tags = options?.tags || [];

    this.cache.set(key, { value, expires, tags });
  }

  async del(key: string): Promise<void> {
    this.cache.delete(key);
  }

  async invalidateByPattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  async invalidateByTag(tag: string): Promise<void> {
    for (const [key, cached] of this.cache.entries()) {
      if (cached.tags.includes(tag)) {
        this.cache.delete(key);
      }
    }
  }

  async clear(): Promise<void> {
    this.cache.clear();
  }
}