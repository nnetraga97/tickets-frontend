import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setTraceHeaderSupplier } from "../api/client";
import { useLocation } from "react-router-dom";
import { tracer, getCurrentTraceId, getCurrentSpanId } from "../telemetry";

function randomHex(len: number) {
    const arr = crypto.getRandomValues(new Uint8Array(len));
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

type TraceContextType = {
    traceId: string;
    spanId?: string;
    buildTraceparent: () => string;
    createSpan: (name: string, attributes?: Record<string, string | number | boolean>) => any;
    getCurrentTraceId: () => string | undefined;
    getCurrentSpanId: () => string | undefined;
};

const Ctx = createContext<TraceContextType>(null as any);

export function TraceProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [traceId, setTraceId] = useState<string>(() => randomHex(16));
    const [spanId, setSpanId] = useState<string | undefined>();

    useEffect(() => {
        setTraceId(randomHex(16));
    }, [location.pathname]);

    // Update span ID when trace ID changes
    useEffect(() => {
        setSpanId(getCurrentSpanId());
    }, [traceId]);

    const buildTraceparent = useCallback(() => {
        const currentSpanId = getCurrentSpanId() || randomHex(8);
        const currentTraceId = getCurrentTraceId() || traceId;
        const traceFlags = '01'; // sampled
        return `00-${currentTraceId}-${currentSpanId}-${traceFlags}`;
    }, [traceId]);

    // Register the traceparent supplier for API calls
    useEffect(() => {
        setTraceHeaderSupplier(buildTraceparent);
    }, [buildTraceparent]);

    const createSpan = useCallback((name: string, attributes?: Record<string, string | number | boolean>) => {
        return tracer.startSpan(name, { attributes });
    }, []);

    const value = useMemo(() => ({ 
        traceId, 
        spanId,
        buildTraceparent, 
        createSpan,
        getCurrentTraceId,
        getCurrentSpanId
    }), [traceId, spanId, buildTraceparent, createSpan]);
    
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrace() {
    return useContext(Ctx);
}

