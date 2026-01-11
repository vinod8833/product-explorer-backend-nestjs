interface CacheOptions {
    ttl?: number;
    tags?: string[];
}
export declare class CacheService {
    private cache;
    get<T>(key: string, options?: {
        ttl?: number;
        tags?: string[];
        fallback?: () => Promise<T>;
    }): Promise<T | null>;
    set(key: string, value: any, options?: CacheOptions): Promise<void>;
    del(key: string): Promise<void>;
    invalidateByPattern(pattern: string): Promise<void>;
    invalidateByTag(tag: string): Promise<void>;
    clear(): Promise<void>;
}
export {};
