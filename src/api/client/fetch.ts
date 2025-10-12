/**
 * Core HTTP Fetch Implementation
 * 
 * Low-level fetch wrapper with retry, caching, and logging
 */

import { API_CONFIG, getFullUrl } from './config';
import { httpCache } from './cache';
import { buildHeaders, getTraceHeader } from './headers';
import { RetryStrategy } from './retry';
import { RequestLogger } from './logging';
import type { FetchOptions, RequestContext } from './types';

/**
 * Main fetch function with retry, caching, and logging
 */
export async function fetchJson<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
    const method = options.method || "GET";
    const url = getFullUrl(path);
    const requestId = crypto.randomUUID();
    const startTime = performance.now();

    // Build request context
    const ctx: RequestContext = {
        requestId,
        method,
        path,
        url,
        startTime,
        attempt: 1,
        metaname: options.metaname
    };

    // Get cache header if applicable
    const ifNoneMatch = httpCache.getIfNoneMatchHeader(method, url);
    const headers = buildHeaders(options.headers, ifNoneMatch);

    // Log request start
    RequestLogger.logRequestStart(ctx, !!options.body, getTraceHeader());

    let lastErr: any;

    // Retry loop
    for (let attempt = 1; attempt <= API_CONFIG.RETRY_ATTEMPTS; attempt++) {
        ctx.attempt = attempt;

        try {
            // Log retry attempts (except first)
            if (attempt > 1) {
                RequestLogger.logRetryAttempt(ctx, String(lastErr));
            }

            // Make the request
            const resp = await fetch(url, {
                method,
                headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: options.signal,
            });

            // Log response
            RequestLogger.logResponseReceived(
                ctx,
                resp.status,
                resp.statusText,
                !!resp.headers.get('etag'),
                resp.headers.get('content-type')
            );

            // Handle 304 Not Modified (cache hit)
            if (resp.status === 304 && method === 'GET') {
                const cached = httpCache.get(method, url);
                if (cached) {
                    RequestLogger.logCacheHit(ctx);
                    return cached.body as T;
                }
            }

            // Handle 400 errors
            if (resp.status === 400) {
                lastErr = new Error(`Error: api not found: ${resp.status} ${resp.statusText}`);
                RequestLogger.log400Error(ctx, lastErr);

                if (RetryStrategy.shouldRetry(attempt, API_CONFIG.RETRY_ATTEMPTS, resp.status)) {
                    await RetryStrategy.sleepBeforeRetry(attempt);
                    continue;
                }
                throw lastErr;
            }

            // Handle 5xx errors
            if (resp.status >= 500) {
                lastErr = new Error(`Server error: ${resp.status} ${resp.statusText}`);
                RequestLogger.logServerError(ctx, resp.status, lastErr);

                if (RetryStrategy.shouldRetry(attempt, API_CONFIG.RETRY_ATTEMPTS, resp.status)) {
                    await RetryStrategy.sleepBeforeRetry(attempt);
                    continue;
                }
                throw lastErr;
            }

            // Handle other HTTP errors
            if (!resp.ok) {
                const errorText = await resp.text();
                const error = new Error(`HTTP error ${resp.status} ${resp.statusText}: ${errorText}`);
                RequestLogger.logHttpError(ctx, resp.status, errorText, error);
                throw error;
            }

            // Success path
            const etag = resp.headers.get('etag') || undefined;
            const data = await resp.json() as T;

            // Cache GET requests with ETag
            if (method === 'GET' && etag) {
                httpCache.set(method, url, etag, data);
            }

            // Log success
            RequestLogger.logSuccess(ctx, JSON.stringify(data).length);

            return data;

        } catch (err) {
            // Handle abort
            if (err instanceof DOMException && err.name === 'AbortError') {
                RequestLogger.logAbort(ctx);
                throw err;
            }

            // Log exception
            lastErr = err;
            const willRetry = attempt < API_CONFIG.RETRY_ATTEMPTS;
            RequestLogger.logException(ctx, err, willRetry);

            // Retry if not last attempt
            if (willRetry) {
                await RetryStrategy.sleepBeforeRetry(attempt);
            }
        }
    }

    // All attempts failed
    RequestLogger.logFinalFailure(ctx, lastErr, API_CONFIG.RETRY_ATTEMPTS);
    throw lastErr;
}

/**
 * POST request helper
 */
export async function postJson<T = any>(
    path: string,
    body: any,
    options: Omit<FetchOptions, 'body'> = {}
): Promise<T> {
    return fetchJson<T>(path, {
        ...options,
        method: 'POST',
        metaname: options.metaname || "post_json",
        body,
    });
}

/**
 * PUT request helper
 */
export async function putJson<T = any>(
    path: string,
    body: any,
    options: Omit<FetchOptions, 'body'> = {}
): Promise<T> {
    return fetchJson<T>(path, {
        ...options,
        method: 'PUT',
        metaname: options.metaname || "put_json",
        body,
    });
}

/**
 * DELETE request helper
 */
export async function deleteJson<T = any>(
    path: string,
    options: FetchOptions = {}
): Promise<T> {
    return fetchJson<T>(path, {
        ...options,
        method: 'DELETE',
        metaname: options.metaname || "delete_json",
    });
}

