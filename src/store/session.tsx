import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "./auth";
import { useAlert } from "./alert";
import { useLogger } from "./logger";

const SS_PREFIX = "tickets_session_";
const SS_START = SS_PREFIX + "start_ts";
const SS_LAST = SS_PREFIX + "last_activity_ts";
const SS_HISTORY = SS_PREFIX + "visited_incidents";

type HistoryItem = { id: string, label?: string, ts: number };

type SessionCtx = {
    idleMinutes: number;
    maxMinutes: number;
    lastActivity: number;
    start: number;
    history: HistoryItem[];
    addVisitedIncident: (id: string, label?: string) => void;
    clearHistory: () => void;
};

const Ctx = createContext<SessionCtx>(null as any);

const idleEnv = Number(import.meta.env.VITE_SESSION_IDLE_MINUTES || 30);
const maxEnv = Number(import.meta.env.VITE_SESSION_MAX_MINUTES || 8 * 60);
const HISTORY_LIMIT = 30;

function now() { return Date.now() };

export function SessionProvider({ children }: { children: React.ReactNode }) {
    const { isAuthenticated, logout } = useAuth();
    const { push } = useAlert();
    const { logEvent } = useLogger();

    const [start, setStart] = useState<number>(() => Number(sessionStorage.getItem(SS_START) || now()));
    const [lastActivity, setLastActivity] = useState<number>(() => Number(sessionStorage.getItem(SS_LAST) || now()));

    const [history, setHistory] = useState<HistoryItem[]>(() => {
        try { return JSON.parse(sessionStorage.getItem(SS_HISTORY) || "[]"); }
        catch {
            return [];
        }
    });

    const idleMinutes = Number.isFinite(idleEnv) && idleEnv > 0 ? idleEnv : 30;
    const maxMinutes = Number.isFinite(maxEnv) && maxEnv > 0 ? maxEnv : 8 * 60;

    useEffect(() => {
        if (!sessionStorage.getItem(SS_START))
            sessionStorage.setItem(SS_START, String(start));
        if (!sessionStorage.getItem(SS_LAST))
            sessionStorage.setItem(SS_LAST, String(lastActivity));
    }, [start, lastActivity]);

    useEffect(() => {
        if (!isAuthenticated)
            return;
        const bump = () => {
            const t = now();
            setLastActivity(t);
            sessionStorage.setItem(SS_LAST, String(t));
        }
        const events: (keyof DocumentEventMap)[] = ["click", "mousemove", "keydown", "scroll", "touchstart"];
        events.forEach((ev) => document.addEventListener(ev, bump, { passive: true }));
        return () => events.forEach((ev) => document.removeEventListener(ev, bump));
    }, [isAuthenticated]);

    const timerId = useRef<number | null>(null);
    useEffect(() => {
        if (!isAuthenticated)
            return;
        const check = () => {
            const t = now();
            const idleMS = idleMinutes * 60 * 1000;
            const maxMs = idleMinutes * 60 * 1000;
            const idleExceeded = t - (Number(sessionStorage.getItem(SS_LAST)) || lastActivity) > idleMS;
            const maxExceeded = t - (Number(sessionStorage.getItem(SS_START)) || start) > maxMs;

            if (idleExceeded || maxExceeded) {
                logEvent(idleExceeded ? "session_idle_timeout" : "session_absolute_timeout");
                push({
                    kind: "warning",
                    title: "Session ended",
                    message: idleExceeded ? "You were signed out due to inactivity." : "Maximum session length received",
                });
                logout();
            }
        };
        timerId.current = window.setInterval(check, 30 * 1000);
        return () => { if (timerId.current) clearInterval(timerId.current); };
    }, [isAuthenticated, idleMinutes, maxMinutes, start, lastActivity, logout, push, logEvent]);

    const addVisitedIncident = useCallback((id: string, label?: string) => {
        if (!id)
            return;
        setHistory((prev) => {
            const ts = now();
            const others = prev.filter((h) => h.id !== id);
            const next = [{ id, label, ts }, ...others].slice(0, HISTORY_LIMIT);
            sessionStorage.setItem(SS_HISTORY, JSON.stringify(next));
            return next;
        });
    }, []);

    const clearHistory = useCallback(() => {
        sessionStorage.setItem(SS_HISTORY, "[]");
        setHistory([]);
    }, []);

    const value = useMemo(
        () => ({ idleMinutes, maxMinutes, lastActivity, start, history, addVisitedIncident, clearHistory }),
        [idleMinutes, maxMinutes, lastActivity, start, history, addVisitedIncident, clearHistory],
    );

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSession() {
    return useContext(Ctx);
}