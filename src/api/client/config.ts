/**
 * API Client Configuration
 * 
 * Centralized configuration for API endpoints and behavior
 */

export const API_CONFIG = {
    BASE_URL: import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '',
    USE_MOCK: String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true',
    RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY_MS: 200,
    REQUEST_TIMEOUT_MS: 30000,
} as const;

/**
 * Get the full URL for an API path
 */
export function getFullUrl(path: string): string {
    if (API_CONFIG.USE_MOCK) {
        return `/mock/tickets.json`;
    }
    
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    
    return `${API_CONFIG.BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

