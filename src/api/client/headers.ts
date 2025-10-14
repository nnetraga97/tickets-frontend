/**
 * API Client Headers
 * 
 * Manages request headers including tracing, caching, and authentication
 */

let traceSupplier: () => string = () => "";

export function setTraceHeaderSupplier(fn: () => string): void {
    traceSupplier = fn;
}

export function getTraceHeader(): string | undefined {
    return traceSupplier?.() || undefined;
}

/**
 * Get authentication token from storage
 */
function getAuthToken(): string | null {
    try {
        const stored = localStorage.getItem('auth_session');
        if (stored) {
            const parsed = JSON.parse(stored);
            return parsed.token || null;
        }
    } catch {
        // Ignore errors
    }
    return null;
}

/**
 * Build headers for a request
 */
export function buildHeaders(
    customHeaders?: Record<string, string>,
    ifNoneMatch?: string
): Record<string, string> {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...customHeaders
    };

    // Add authentication header if token available
    const token = getAuthToken();
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Add trace header if available
    const trace = getTraceHeader();
    if (trace) {
        headers['traceparent'] = trace;
    }

    // Add caching header if provided
    if (ifNoneMatch) {
        headers['If-None-Match'] = ifNoneMatch;
    }

    return headers;
}

