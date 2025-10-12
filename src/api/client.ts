/**
 * API Client - Legacy Entry Point
 * 
 * This file maintains backward compatibility while using the new modular client structure.
 * New code should import from './client/index' or specific submodules.
 * 
 * Refactored structure:
 * - client/config.ts: Configuration and URL building
 * - client/types.ts: TypeScript type definitions
 * - client/headers.ts: Header management and tracing
 * - client/cache.ts: HTTP caching with ETags
 * - client/retry.ts: Retry strategy and backoff
 * - client/logging.ts: Comprehensive request logging
 * - client/fetch.ts: Core HTTP implementation
 * - client/index.ts: Main exports
 */

export { 
    fetchJson, 
    postJson, 
    putJson, 
    deleteJson,
    setTraceHeaderSupplier,
    API_CONFIG,
    getFullUrl,
    httpCache
} from './client/index';

export type { FetchOptions } from './client/types';
