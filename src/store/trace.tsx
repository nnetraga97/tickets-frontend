import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { setTraceHeaderSupplier } from "../api/client";
import { useLocation } from "react-router-dom";

function randomHex(len: number) {
    const arr = crypto.getRandomValues(new Uint8Array(len));
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
}

type TraceContextType = {
    traceId: string;
    buildTraceparent: () => string;
};

const Ctx = createContext<TraceContextType>(null as any);

export function TraceProvider({ children }: { children: React.ReactNode }) {
    const location = useLocation();
    const [traceId, setTraceId] = useState<string>(() => randomHex(16));

    useEffect(() => {
        setTraceId(randomHex(16));
    }, [location.pathname]);

    const buildTraceparent = useCallback(() => {
        const spanId = randomHex(8);
        const traceFlags = '01'; // sampled
        return `00-${traceId}-${spanId}-${traceFlags}`;
    }, [traceId]);

    // Register the traceparent supplier for API calls
    useEffect(() => {
        setTraceHeaderSupplier(buildTraceparent);
    }, [buildTraceparent]);

    const value = useMemo(() => ({ traceId, buildTraceparent }), [traceId, buildTraceparent]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTrace() {
    return useContext(Ctx);
}

