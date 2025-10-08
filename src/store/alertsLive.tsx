import { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ServerAlert, connectAlertsSSE, listAlerts, markAlertRead as apiMarkRead, markAllAlertsRead as apiMarkAllRead } from "../api/alerts";
import { useAlert } from "./alert";

type AlertsCtx = {
    alerts: ServerAlert[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    isServerEnabled: boolean;
}

const Ctx = createContext<AlertsCtx>(null as any);

const BACKEND_ON = String(import.meta.env.VITE_ALERTS_BACKEND || "false").toLowerCase() === "true";
const TRANSPORT = (import.meta.env.VITE_ALERTS_TRANSPORT || "poll").toLowerCase();
const POLL_MS = Number(import.meta.env.VITE_ALERTS_POLL || 7000);

export function AlertsLiveProvider({ children }: { children: React.ReactNode }) {
    const qc = useQueryClient();
    const { push } = useAlert();
    const sseRef = useRef<EventSource | null>(null);

    const { data: serverAlerts } = useQuery({
        queryKey: ["alerts"],
        queryFn: ({ signal }) => listAlerts(signal),
        enabled: BACKEND_ON,
        refetchInterval: BACKEND_ON && TRANSPORT !== "sse" ? (ctx) => (document.hidden ? POLL_MS * 4 : POLL_MS) : false,
        staleTime: 5_000,
        gcTime: 30 * 60_000,
    });

    useEffect(() => {
        if (!BACKEND_ON || TRANSPORT !== "sse" || typeof window === "undefined")
            return;
        if (sseRef.current)
            return;
        const es = connectAlertsSSE();
        if (!es)
            return;

        sseRef.current = es;

        es.onmessage = (ev) => {
            try {
                const payload = JSON.parse(ev.data);
                if (!payload)
                    return;
                const { type, alert } = payload as { type: "created" | "updated" | "deleted"; alert: ServerAlert };
                qc.setQueryData<ServerAlert[]>(["alerts"], (prev) => {
                    const list = Array.isArray(prev) ? [...prev] : [];
                    const idx = list.findIndex((a) => a.id === alert.id);
                    if (type === "deleted") {
                        if (idx >= 0)
                            list.splice(idx, 1);
                    }
                    else if (idx > 0) {
                        list[idx] = alert;
                    }
                    else {
                        list.unshift(alert);

                        if (!alert.read) {
                            push({
                                title: alert.title || "New alert",
                                message: alert.message,
                                kind: (alert.kind as any) || "info",
                                routeTo: alert.routeTo || undefined,
                                toInbox: false,
                            });
                        }
                    }
                    return list.slice(0, 500);
                });
            } catch {

            }
        };

        es.onerror = () => {
            try {
                es.close();
            }
            catch {

            }
            sseRef.current = null;
        }

        return () => {
            try {
                es.close();
            } catch { }
            sseRef.current = null;
        };
    }, [qc, push]);

    const alerts = useMemo(() => (serverAlerts ?? []).slice().sort((a, b) => (b.ts || 0) - (a.ts || 0)), [serverAlerts]);
    const unreadCount = useMemo(() => alerts.filter((a) => !a.read).length, [alerts]);

    const markRead = useCallback((id: string) => {
        if (!BACKEND_ON)
            return;

        qc.setQueryData<ServerAlert[]>(["alerts"], (prev) =>
            (prev ?? []).map((a) => (a.id === id ? { ...a, read: true } : a)),
        );
        apiMarkRead(id, true).catch(() => {
            qc.invalidateQueries({ queryKey: ["alerts"] });
        });
    }, [qc]);

    const markAllRead = useCallback(() => {
        if (!BACKEND_ON)
            return;
        qc.setQueryData<ServerAlert[]>(["alerts"], (prev) => (prev ?? []).map((a) => ({ ...a, read: true })));
        apiMarkAllRead().catch(() => { qc.invalidateQueries({ queryKey: ["alerts"] }); })
    }, [qc]);

    const ctx: AlertsCtx = useMemo(
        () => ({ alerts, unreadCount, markRead, markAllRead, isServerEnabled: BACKEND_ON }),
        [alerts, unreadCount, markRead, markAllRead],
    );

    return <Ctx.Provider value={ctx}>{children}</Ctx.Provider>
}

export function useAlertsLive() {
    const ctx = useContext(Ctx);
    return ctx as AlertsCtx;
}