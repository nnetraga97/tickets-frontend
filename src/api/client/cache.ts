/**
 * API Client Caching
 * 
 * ETag-based HTTP caching for GET requests
 */

import { ETagCache } from '../../utils/etagCache';
import type { CacheEntry } from './types';

export class HttpCache {
    private cache: ETagCache<any>;

    constructor() {
        this.cache = new ETagCache<any>();
    }

    /**
     * Get cache key for a request
     */
    getCacheKey(method: string, url: string): string {
        return `${method} ${url}`;
    }

    /**
     * Get cached entry
     */
    get<T>(method: string, url: string): CacheEntry<T> | undefined {
        const key = this.getCacheKey(method, url);
        return this.cache.get(key);
    }

    /**
     * Set cache entry
     */
    set<T>(method: string, url: string, etag: string, body: T): void {
        const key = this.getCacheKey(method, url);
        this.cache.set(key, { etag, body });
    }

    /**
     * Get If-None-Match header for conditional requests
     */
    getIfNoneMatchHeader(method: string, url: string): string | undefined {
        if (method !== 'GET') {
            return undefined;
        }
        
        const cached = this.get(method, url);
        return cached?.etag;
    }
}

// Singleton cache instance
export const httpCache = new HttpCache();

