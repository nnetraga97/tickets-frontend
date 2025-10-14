/**
 * API Client - Main Entry Point
 * 
 * A clean, modular HTTP client with:
 * - Automatic retries with exponential backoff
 * - ETag-based caching for GET requests
 * - Comprehensive logging with trace IDs
 * - Request/response timing
 * - Error handling and classification
 * 
 * Structure:
 * - config.ts: Configuration and URL building
 * - types.ts: TypeScript definitions
 * - headers.ts: Header management and tracing
 * - cache.ts: HTTP caching with ETags
 * - retry.ts: Retry strategy and backoff
 * - logging.ts: Comprehensive request logging
 * - fetch.ts: Core HTTP implementation
 */

// Re-export everything from submodules
export { API_CONFIG, getFullUrl } from './config';
export { setTraceHeaderSupplier, buildHeaders } from './headers';
export { httpCache } from './cache';
export { RetryStrategy } from './retry';
export { RequestLogger } from './logging';
export { fetchJson, postJson, putJson, deleteJson } from './fetch';

export type { FetchOptions, RequestContext, CacheEntry } from './types';

