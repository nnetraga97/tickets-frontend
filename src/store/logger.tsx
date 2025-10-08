import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { postJson } from "../api/client";
import { useTrace } from "./trace";

type LogRecord = { ts: number; type: string; data?: any; traceId?: string };
type ErrorRecord = { ts: number; type: string; message: string; stack?: string; traceId?: string };

const LOG_KEYS = "fw_logs_buffer";
const ERROR_KEYS = "fw_errors_buffer";

const Ctx = createContext({
    logEvent: (_type: string, _data?: any) => { },
    logError: (_type: string, _err: unknown, _extra?: any) => { },
});

export function LoggerProvider({ children }: { children: React.ReactNode }) {
    const { traceId } = useTrace();
    const logs = useRef<LogRecord[]>(
        (() => {
            try {
                const stored = localStorage.getItem(LOG_KEYS);
                return stored ? (JSON.parse(stored) as LogRecord[]) : [];
            } catch {
                return [];
            }
        })()
    );
    const errors = useRef<ErrorRecord[]>(
        (() => {
            try {
                const stored = localStorage.getItem(ERROR_KEYS);
                return stored ? (JSON.parse(stored) as ErrorRecord[]) : [];
            } catch {
                return [];
            }
        })()
    );

    const persist = () => {
        try {
            localStorage.setItem(LOG_KEYS, JSON.stringify(logs.current));
            localStorage.setItem(ERROR_KEYS, JSON.stringify(errors.current));
        } catch { }
    };

    const logEvent = useCallback(
        (type: string, data?: any) => {
            logs.current.push({ ts: Date.now(), type, data, traceId });
            if (logs.current.length > 100) logs.current.shift();
            persist();
        },
        [traceId],
    );

    const logError = useCallback(
        (type: string, err: unknown, extra?: any) => {
            const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');
            console.log({ ts: Date.now(), type, message: e.message, stack: e.stack, traceId });
            errors.current.push({ ts: Date.now(), type, message: e.message, stack: e.stack, traceId });
            persist();
        }, [traceId],);

    // Periodically flush logs to server
    useEffect(() => {
        const flush = async () => {
            if (logs.current.length) {
                const payload = logs.current.splice(0, logs.current.length);
                try {
                    await postJson('/api/logs', payload, { metaname: 'post_logs' });
                } catch {
                    logs.current.unshift(...payload); // restore on failure
                }
            }
            if (errors.current.length) {
                const payload = errors.current.splice(0, errors.current.length);
                try {
                    await postJson('/api/errors', payload, { metaname: 'post_errors' });
                } catch {
                    errors.current.unshift(...payload); // restore on failure
                }
            }
            persist();
        };

        const id = setInterval(flush, 60000);
        const onVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                flush().catch(() => { });
            }
        };
        document.addEventListener('visibilitychange', onVisibilityChange);
        return () => {
            clearInterval(id);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, []);

    useEffect(() => {
        const onError = (event: ErrorEvent) => {
            logError('unhandled_error', event.error ?? event.message);
        };
        const onRejection = (event: PromiseRejectionEvent) => {
            logError('unhandled_promise_rejection', event.reason);
        };
        window.addEventListener('error', onError);
        window.addEventListener('unhandledrejection', onRejection);
        return () => {
            window.removeEventListener('error', onError);
            window.removeEventListener('unhandledrejection', onRejection);
        };
    }, [logError]);

    const value = useMemo(() => ({ logEvent, logError }), [logEvent, logError]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLogger() {
    return useContext(Ctx);
}

export function logErrorDirect(type: string, err: unknown, extra?: any) {
    const arr: ErrorRecord[] = JSON.parse(localStorage.getItem(ERROR_KEYS) || '[]');
    const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');
    arr.push({ ts: Date.now(), type, message: e.message, stack: e.stack });
    try {
        localStorage.setItem(ERROR_KEYS, JSON.stringify(arr));
    } catch { }
}

export function logApiDirect(type: string, data: any) {
    const arr: LogRecord[] = JSON.parse(localStorage.getItem(LOG_KEYS) || '[]');
    arr.push({ ts: Date.now(), type, data });
    try {
        localStorage.setItem(LOG_KEYS, JSON.stringify(arr));
    } catch { }
}

export function readLogs(): LogRecord[] {
    try {
        return JSON.parse(localStorage.getItem(LOG_KEYS) || "[]");
    } catch {
        return [];
    }
}

export function readErrors(): LogRecord[] {
    try {
        return JSON.parse(localStorage.getItem(ERROR_KEYS) || "[]");
    } catch {
        return [];
    }
}

export function clearAllLogs() {
    localStorage.removeItem(LOG_KEYS);
    localStorage.removeItem(ERROR_KEYS);
}
