/**
 * Type definitions for the API client
 */

export type FetchOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    metaname?: string;
};

export type RequestContext = {
    requestId: string;
    method: string;
    path: string;
    url: string;
    startTime: number;
    attempt: number;
    metaname?: string;
};

export type CacheEntry<T> = {
    etag: string;
    body: T;
};

