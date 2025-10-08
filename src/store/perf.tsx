import React, { createContext, useContext, useEffect, useMemo, useRef } from "react";

type PerfRecord = {
    ts: number,
    type: string;
    name?: string;
    dur?: number;
    data?: any;
};

type Ctx = { downloadNDJSON: () => void; clear: () => void };

const Ctx = createContext<Ctx>({ downloadNDJSON: () => { }, clear: () => { } });

const KEY = "perf_records_v1";

const CAP = 5000;

function readAll(): PerfRecord[] {
    try {
        return JSON.parse(localStorage.getItem(KEY) || "[]") as PerfRecord[];
    }
    catch {
        return [];
    }
}

function writeAll(arr: PerfRecord[]) {
    try {
        localStorage.setItem(KEY, JSON.stringify(arr.slice(-CAP)));
    }
    catch {

    }
}

function pushRec(r: PerfRecord) {
    console.log("pushing performance metric");
    const arr = readAll();
    arr.push(r);
    writeAll(arr);
}

export function PerfProvider({ children }: { children: React.ReactNode }) {

    const initRef = useRef(false);

    useEffect(() => {
        console.log("Performance UseEffect")
        if (initRef.current)
            return;
        initRef.current = true;
        pushRec({ ts: Date.now(), type: "boot", name: location.pathname });

        try {
            const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined
            if (nav) {
                pushRec({
                    ts: Date.now(), type: "navigation", name: nav.name, dur: nav.duration,
                    data: {
                        domContentLoaded: nav.domContentLoadedEventEnd - nav.domContentLoadedEventEnd,
                        loadEventEnd: nav.loadEventEnd - nav.loadEventStart,
                        transferSize: (nav as any).transferSize ?? undefined,
                    }
                });
            }
        } catch {

        }

        try {
            const painObs = new PerformanceObserver((list) => {
                for (const e of list.getEntries()) {
                    pushRec({ ts: Date.now(), type: "paint", name: e.name, dur: e.startTime });
                }
            });
            painObs.observe({ type: "paint", buffered: true as any });
        } catch {

        }

        try {
            const lcpObs = new PerformanceObserver((list) => {
                const last = list.getEntries().pop();
                if (last)
                    pushRec({ ts: Date.now(), type: "lcp", name: last.name, dur: last.startTime });
            });
            lcpObs.observe({ type: "largest-contentful-paint", buffered: true as any });
        } catch {

        }

        try {
            let cls = 0;
            const clsObs = new PerformanceObserver((list) => {
                for (const e of list.getEntries() as any[]) {
                    if (!e.hasRecentInput)
                        cls += e.value;
                }
                pushRec({ ts: Date.now(), type: "layout-shift", dur: cls });
            });
            clsObs.observe({ type: "layout-shift", buffered: true as any });
        } catch {
        }

        try {

            const fidObs = new PerformanceObserver((list) => {
                const e = list.getEntries()[0] as PerformanceEventTiming | undefined;
                if (e)
                    pushRec({ ts: Date.now(), type: "first-input", dur: e.processingStart - e.startTime, data: { name: e.name } });
            });
            fidObs.observe({ type: "first-input", buffered: true as any });
        } catch {
        }

        try {

            const longObs = new PerformanceObserver((list) => {
                for (const e of list.getEntries() as any) {
                    pushRec({ ts: Date.now(), type: "longtask", dur: e.duration, data: { name: e.name, startTime: e.startTime } });

                }
            });
            longObs.observe({ type: "longtask", buffered: true as any });
        } catch {
        }

        const onVis = () => { if (document.visibilityState === "hidden") {/*data already in LS*/ } };
        document.addEventListener("visibilitychange", onVis);
        return () => document.removeEventListener("visibilitychange", onVis);
    }, []);

    const downloadNDJSON = () => {
        const nd = readAll().map((r) => JSON.stringify(r)).join("\n");
        const blob = new Blob([nd], { type: "application/x-ndjson" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
        a.href = url;
        a.download = `perf-${ts}.ndjson`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const clear = () => writeAll([]);

    const value = useMemo(() => ({ downloadNDJSON, clear }), []);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePerf() {
    return useContext(Ctx);
}