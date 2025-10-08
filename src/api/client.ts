
import { sleep } from "../utils/backoff";
import { ETagCache } from "../utils/etagCache";
import { useLogger, logApiDirect } from '../store/logger';
import { useLocation } from "react-router-dom";

let traceSupplier: () => string = () => "";
export function setTraceHeaderSupplier(fn: () => string) {
    traceSupplier = fn;
}

const etags = new ETagCache<any>();

// Vite automatically provides types for import.meta.env, so no need to redeclare ImportMeta or ImportMetaEnv.

const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') || '';
const USE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true';

function getFullUrl(path: string) {
    if (USE_MOCK)
        return `/mock/tickets.json`;
    if (path.startsWith('http://') || path.startsWith('https://')) {
        return path;
    }
    return `${API_BASE}${path.startsWith('/') ? '' : '/'}${path}`;
}

type FetchOptions = {
    method?: string;
    headers?: Record<string, string>;
    body?: any;
    signal?: AbortSignal;
    metaname?: string;
};

export async function fetchJson<T = any>(path: string, options: FetchOptions = {}): Promise<T> {
    const method = options.method || "GET";
    const url = getFullUrl(path);
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    const trace = traceSupplier?.();
    if (trace) {
        headers['traceparent'] = trace;
    }
    const cacheKey = `${method} ${url}`;
    if (method === 'GET') {
        const cached = etags.get(cacheKey);
        if (cached?.etag) {
            headers['If-None-Match'] = cached.etag;
        }
    }

    const attempts = 3;
    let lastErr: any;

    const t0 = performance.now();
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            console.log("attempt:" + attempt);
            import("../store/logger").then(({ logApiDirect }) => {
                logApiDirect(options.metaname ? options.metaname + attempt : path, {
                    duration_ms: Math.round(performance.now() - t0),
                    ok: false,
                    error: String(lastErr),
                    url,
                });
            });
            const resp = await fetch(url, {
                method,
                headers: headers,
                body: options.body ? JSON.stringify(options.body) : undefined,
                signal: options.signal,
            });
            if (resp.status === 304 && method === 'GET') {
                const cached = etags.get(cacheKey);
                if (cached) {
                    return cached.body as T;
                }
            }

            if (resp.status >= 500) {
                lastErr = new Error(`Server error: ${resp.status} ${resp.statusText}`);
                if (attempt < attempts) {
                    await sleep((attempt + 1) * 200);
                    continue;
                }
            }

            if (!resp.ok) {
                const errorText = await resp.text();
                throw new Error(`HTTP error ${resp.status} ${resp.statusText}: ${errorText}`);
            }

            const etag = resp.headers.get('etag') || undefined;
            const data = await resp.json() as T;
            if (method === 'GET' && etag) {
                etags.set(cacheKey, { etag, body: data });
            }
            return data;
        } catch (err) {
            const t1 = performance.now();
            import("../store/logger").then(({ logApiDirect }) => {
                logApiDirect(options.metaname || path, {
                    duration_ms: Math.round(t1 - t0),
                    ok: false,
                    error: String(lastErr),
                    url,
                });
            });
            if (err instanceof DOMException && err.name === 'AbortError') {
                throw err;
            }
            lastErr = err;
            if (attempt < attempts - 1) {
                await sleep((attempt + 1) * 200);
            }
        }
    }
    const t1 = performance.now();
    console.log(t1 - t0);
    import("../store/logger").then(({ logApiDirect }) => {
        logApiDirect(options.metaname || path, {
            duration_ms: Math.round(t1 - t0),
            ok: false,
            error: String(lastErr),
            url,
        });
    });

    throw lastErr;
}

export async function postJson<T = any>(path: string, body: any, options: Omit<FetchOptions, 'body'> = {}) {
    return fetchJson<T>(path, {
        ...options,
        method: 'POST',
        metaname: "post_json",
        body,
    });
}
