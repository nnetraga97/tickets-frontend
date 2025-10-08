import { fetchJson, postJson } from "./client";

export type ServerAlert = {
    id: string;
    ts: number;
    title?: string | null;
    message: string;
    kind?: "info" | "success" | "warning" | "error" | null;
    routeTo?: string | null;
    read: boolean;
    updated_at?: number;
};

const BACKEND_ON = String(import.meta.env.VITE_ALERTS_BACKEND || "false").toLowerCase() === "true";

async function api_listAlerts(signal?: AbortSignal): Promise<ServerAlert[]> {
    return fetchJson<ServerAlert[]>("/api/alerts", { signal, metaname: "alerts:list" });
}

async function api_markAlertRead(id: string, read: boolean, signal?: AbortSignal) {
    return postJson<ServerAlert>(`api/alerts/${encodeURIComponent(id)}/read`, { read }, { signal, metaname: "alerts/read" });
}

async function api_markAllAlertsRead(signal?: AbortSignal) {
    return postJson<{ update: number }>(`/api/alerts/read-all`, {}, { signal, metaname: "alerts:readAll" });
}

async function api_createAlert(a: Omit<ServerAlert, "id" | "updated_at">, signal?: AbortSignal) {
    return postJson<ServerAlert>("api/alerts", a, { signal, metaname: "alerts:create" });
}


const LS_KEY = "mock_server_alerts_v1";

function loadMock(): ServerAlert[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw)
            return JSON.parse(raw) as ServerAlert[];
    }
    catch { }
    const seed: ServerAlert[] = [
        {
            id: rid(),
            ts: Date.now() - 1000 * 60 * 30,
            title: "scrape queued",
            message: "Scrape job queued for INC-1001",
            kind: "info",
            routeTo: "/tickets/INC-1001",
            read: false,
            updated_at: Date.now() - 1000 * 60 * 30,
        },
        {
            id: rid(),
            ts: Date.now() - 1000 * 60 * 30,
            title: "Eligibility finished",
            message: "EDG run completed for INC-1002",
            kind: "success",
            routeTo: "/tickets/INC-1002",
            read: false,
            updated_at: Date.now() - 1000 * 60 * 30,
        },
        {
            id: rid(),
            ts: Date.now() - 1000 * 60 * 30,
            title: "Datafix requried",
            message: "Manual review required for INC-1003",
            kind: "warning",
            routeTo: "/tickets/INC-1003",
            read: false,
            updated_at: Date.now() - 1000 * 60 * 30,
        },
    ];
    saveMock(seed);
    return seed;
}

function saveMock(arr: ServerAlert[]) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(arr)); }
    catch { }
}

function rid() {
    return Math.random().toString(36).slice(2, 10);
}

function delay<T>(v: T, ms = 150): Promise<T> {
    return new Promise((res) => setTimeout(() => res(v), ms));
}

async function mock_listAlerts(): Promise<ServerAlert[]> {
    const list = loadMock().slice().sort((a, b) => (b.ts || 0) - (a.ts || 0));
    return delay(list);
}

async function mock_markAlertRead(id: string, read: boolean): Promise<ServerAlert> {
    const list = loadMock();
    const i = list.findIndex((a) => a.id === id);
    if (i >= 0) {
        list[i] = { ...list[i], read, updated_at: Date.now() };
        saveMock(list);
        return delay(list[i]);
    }

    const created: ServerAlert = {
        id,
        ts: Date.now(),
        title: "Unknown Alert",
        message: "This alert was not present in mock store; created runtime",
        kind: "info",
        routeTo: null,
        read,
        updated_at: Date.now(),
    };

    saveMock([created, ...list]);
    return delay(created);
}

async function mock_markAllAlertsRead(): Promise<{ updated: number }> {
    const list = loadMock();
    let count = 0;
    const next = list.map((a) => {
        if (!a.read) {
            count++;
            return { ...a, read: true, updated_at: Date.now() };
        }
        return a;
    })
    saveMock(next);
    return delay({ updated: count });
}

async function mock_createAlert(a: Omit<ServerAlert, "id" | "updated_at">): Promise<ServerAlert> {
    const list = loadMock();
    const id = rid();
    const item: ServerAlert = {
        ...a,
        id,
        ts: a.ts || Date.now(),
        updated_at: Date.now(),
        title: a.title ?? null,
        kind: a.kind ?? "info",
        read: !!a.read,
    };
    saveMock([item, ...list].slice(0, 500));
    return delay(item);
}

export async function listAlerts(signal?: AbortSignal): Promise<ServerAlert[]> {
    return BACKEND_ON ? api_listAlerts(signal) : mock_listAlerts();
}

export async function markAllAlertsRead(signal?: AbortSignal) {
    return BACKEND_ON ? api_markAllAlertsRead(signal) : mock_markAllAlertsRead();
}

export async function markAlertRead(id: string, read: boolean, signal?: AbortSignal) {
    return BACKEND_ON ? api_markAlertRead(id, read, signal) : mock_markAlertRead(id, read);
}

export async function createAlert(a: Omit<ServerAlert, "id" | "updated_at">, signal?: AbortSignal) {
    return BACKEND_ON ? api_createAlert(a, signal) : mock_createAlert(a);
}

export function connectAlertsSSE(url = "/api/alerts/stram") {
    if (!BACKEND_ON) return null;
    try {
        const es = new EventSource(url, { withCredentials: true });
        return es;
    }
    catch {
        return null;
    }
}



