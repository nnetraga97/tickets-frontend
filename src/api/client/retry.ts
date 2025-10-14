/**
 * API Client Retry Logic
 * 
 * Handles retry logic with exponential backoff for failed requests
 */

import { sleep } from '../../utils/backoff';
import { API_CONFIG } from './config';

export class RetryStrategy {
    /**
     * Calculate delay for retry attempt
     */
    static getRetryDelay(attempt: number): number {
        return (attempt + 1) * API_CONFIG.RETRY_BASE_DELAY_MS;
    }

    /**
     * Check if error is retryable
     */
    static isRetryableError(status?: number): boolean {
        if (!status) return false;
        
        // Retry on 400 (as per original logic) and 5xx errors
        return status === 400 || status >= 500;
    }

    /**
     * Sleep before retry
     */
    static async sleepBeforeRetry(attempt: number): Promise<void> {
        const delay = this.getRetryDelay(attempt);
        await sleep(delay);
    }

    /**
     * Check if should retry
     */
    static shouldRetry(attempt: number, totalAttempts: number, status?: number): boolean {
        if (attempt >= totalAttempts) {
            return false;
        }
        
        return this.isRetryableError(status);
    }
}

