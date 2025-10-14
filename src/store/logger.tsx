import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { postJson } from "../api/client";
import { useTrace } from "./trace";

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export type LogRecord = { 
    ts: number; 
    level: LogLevel;
    type: string; 
    data?: any; 
    trace_id?: string;
    location?: string; // component/file where log originated
    duration_ms?: number; // for performance tracking
    url?: string; // current page URL
    user_agent?: string; // browser user agent
    session_id?: string; // session identifier
};

type ErrorRecord = { 
    ts: number; 
    type: string; 
    message: string; 
    stack?: string; 
    trace_id?: string;
    location?: string;
    context?: any; // additional context for debugging
    url?: string; // current page URL
    user_agent?: string; // browser user agent
    session_id?: string; // session identifier
};

const LOG_KEYS = "fw_logs_buffer";
const ERROR_KEYS = "fw_errors_buffer";
const SESSION_ID_KEY = "fw_session_id";

// Get or create session ID
function getSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
        sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem(SESSION_ID_KEY, sessionId);
    }
    return sessionId;
}

// Get common context for all logs
function getLogContext() {
    return {
        url: window.location.href,
        user_agent: navigator.userAgent,
        session_id: getSessionId(),
    };
}

// Performance timing utility
export class PerfTimer {
    private startTime: number;
    private name: string;
    
    constructor(name: string) {
        this.name = name;
        this.startTime = performance.now();
    }
    
    end(): number {
        return Math.round(performance.now() - this.startTime);
    }
    
    getName(): string {
        return this.name;
    }
}

const Ctx = createContext({
    logDebug: (_type: string, _data?: any, _location?: string) => { },
    logInfo: (_type: string, _data?: any, _location?: string) => { },
    logWarn: (_type: string, _data?: any, _location?: string) => { },
    logEvent: (_type: string, _data?: any) => { },
    logError: (_type: string, _err: unknown, _extra?: any) => { },
    startTimer: (_name: string): PerfTimer => new PerfTimer(_name),
    logTiming: (_timer: PerfTimer, _data?: any) => { },
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

    // Internal logging function with level support
    const log = useCallback((level: LogLevel, type: string, data?: any, location?: string) => {
        const context = getLogContext();
        const record: LogRecord = { 
            ts: Date.now(), 
            level,
            type, 
            data, 
            trace_id: traceId,
            location,
            url: context.url,
            user_agent: context.user_agent,
            session_id: context.session_id,
        };
        
        // Console output for development
        if (import.meta.env.DEV) {
            const style = level === 'ERROR' ? 'color: red' : level === 'WARN' ? 'color: orange' : level === 'INFO' ? 'color: blue' : 'color: gray';
            console.log(`%c[${level}] ${type}${location ? ` @${location}` : ''}`, style, data || '');
        }
        
        logs.current.push(record);
        if (logs.current.length > 500) logs.current.shift();
        persist();
    }, [traceId]);

    const logDebug = useCallback((type: string, data?: any, location?: string) => {
        log('DEBUG', type, data, location);
    }, [log]);

    const logInfo = useCallback((type: string, data?: any, location?: string) => {
        log('INFO', type, data, location);
    }, [log]);

    const logWarn = useCallback((type: string, data?: any, location?: string) => {
        log('WARN', type, data, location);
    }, [log]);

    const logEvent = useCallback(
        (type: string, data?: any) => {
            log('INFO', type, data);
        },
        [log],
    );

    const logError = useCallback(
        (type: string, err: unknown, extra?: any) => {
            const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');
            const context = getLogContext();
            const record: ErrorRecord = { 
                ts: Date.now(), 
                type, 
                message: e.message, 
                stack: e.stack, 
                trace_id: traceId,
                context: extra,
                url: context.url,
                user_agent: context.user_agent,
                session_id: context.session_id,
            };
            
            console.error(`[ERROR] ${type}`, { message: e.message, stack: e.stack, context: extra });
            errors.current.push(record);
            persist();
        }, [traceId],);

    const startTimer = useCallback((name: string): PerfTimer => {
        return new PerfTimer(name);
    }, []);

    const logTiming = useCallback((timer: PerfTimer, data?: any) => {
        const duration = timer.end();
        log('INFO', `perf_${timer.getName()}`, { ...data, duration_ms: duration });
    }, [log]);

    // Periodically flush logs to server
    useEffect(() => {
        const flush = async () => {
            if (logs.current.length) {
                const payload = logs.current.splice(0, logs.current.length);
                console.log('payload', payload);
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

    const value = useMemo(() => ({ 
        logDebug, 
        logInfo, 
        logWarn, 
        logEvent, 
        logError,
        startTimer,
        logTiming 
    }), [logDebug, logInfo, logWarn, logEvent, logError, startTimer, logTiming]);
    
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLogger() {
    return useContext(Ctx);
}

export function logErrorDirect(type: string, err: unknown, extra?: any) {
    const arr: ErrorRecord[] = JSON.parse(localStorage.getItem(ERROR_KEYS) || '[]');
    const e = err instanceof Error ? err : new Error(typeof err === 'string' ? err : 'Unknown error');
    const context = getLogContext();
    arr.push({ 
        ts: Date.now(), 
        type, 
        message: e.message, 
        stack: e.stack,
        context: extra,
        url: context.url,
        user_agent: context.user_agent,
        session_id: context.session_id,
    });
    console.error(`[ERROR] ${type}`, { message: e.message, stack: e.stack, context: extra });
    try {
        localStorage.setItem(ERROR_KEYS, JSON.stringify(arr));
    } catch { }
}

export function logApiDirect(type: string, data: any, location?: string) {
    const arr: LogRecord[] = JSON.parse(localStorage.getItem(LOG_KEYS) || '[]');
    const context = getLogContext();
    arr.push({ 
        ts: Date.now(), 
        level: 'INFO',
        type, 
        data,
        location,
        url: context.url,
        user_agent: context.user_agent,
        session_id: context.session_id,
    });
    if (import.meta.env.DEV) {
        console.log(`%c[API] ${type}${location ? ` @${location}` : ''}`, 'color: green', data || '');
    }
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
