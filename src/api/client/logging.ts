/**
 * API Client Logging
 * 
 * Comprehensive logging for all API requests, responses, and errors
 */

import { logApiDirect, logErrorDirect } from '../../store/logger';
import type { RequestContext } from './types';

export class RequestLogger {
    /**
     * Log the start of an API request
     */
    static logRequestStart(ctx: RequestContext, hasBody: boolean, trace?: string): void {
        logApiDirect('api_request_start', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            url: ctx.url,
            hasBody,
            metaname: ctx.metaname,
            trace
        }, 'api/client');
    }

    /**
     * Log a retry attempt
     */
    static logRetryAttempt(ctx: RequestContext, previousError: string): void {
        logApiDirect('api_retry_attempt', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            attempt: ctx.attempt,
            previousError
        }, 'api/client');
    }

    /**
     * Log response received
     */
    static logResponseReceived(
        ctx: RequestContext,
        status: number,
        statusText: string,
        hasEtag: boolean,
        contentType: string | null
    ): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logApiDirect('api_response_received', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            status,
            statusText,
            attempt: ctx.attempt,
            duration_ms,
            hasEtag,
            contentType
        }, 'api/client');
    }

    /**
     * Log cache hit (304 response)
     */
    static logCacheHit(ctx: RequestContext): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logApiDirect('api_cache_hit', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            duration_ms
        }, 'api/client');
    }

    /**
     * Log 400 error
     */
    static log400Error(ctx: RequestContext, error: Error): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logErrorDirect('api_400_error', error, {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            attempt: ctx.attempt,
            duration_ms
        });
    }

    /**
     * Log server error (5xx)
     */
    static logServerError(ctx: RequestContext, status: number, error: Error): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logErrorDirect('api_server_error', error, {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            status,
            attempt: ctx.attempt,
            duration_ms
        });
    }

    /**
     * Log HTTP error (non-2xx response)
     */
    static logHttpError(ctx: RequestContext, status: number, errorText: string, error: Error): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logErrorDirect('api_http_error', error, {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            status,
            errorText,
            duration_ms
        });
    }

    /**
     * Log successful request
     */
    static logSuccess(ctx: RequestContext, dataSize: number): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logApiDirect('api_request_success', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            attempt: ctx.attempt,
            duration_ms,
            dataSize
        }, 'api/client');
    }

    /**
     * Log request abort
     */
    static logAbort(ctx: RequestContext): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logApiDirect('api_request_aborted', {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            attempt: ctx.attempt,
            duration_ms
        }, 'api/client');
    }

    /**
     * Log request exception
     */
    static logException(ctx: RequestContext, error: unknown, willRetry: boolean): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logErrorDirect('api_request_exception', error, {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            attempt: ctx.attempt,
            duration_ms,
            willRetry
        });
    }

    /**
     * Log final failure after all retries
     */
    static logFinalFailure(ctx: RequestContext, error: unknown, attempts: number): void {
        const duration_ms = Math.round(performance.now() - ctx.startTime);
        
        logErrorDirect('api_request_failed_all_retries', error, {
            requestId: ctx.requestId,
            method: ctx.method,
            path: ctx.path,
            url: ctx.url,
            attempts,
            duration_ms
        });
    }
}

