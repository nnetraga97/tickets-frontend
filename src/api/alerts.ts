import { fetchJson, postJson, putJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

export type ServerAlert = {
    id: string;
    level: string; // Backend uses "level" instead of "kind"  
    title?: string | null;
    message: string;
    route_to?: string | null; // Backend uses snake_case
    read_flag: boolean; // Backend uses read_flag
    created_at: string; // ISO timestamp from backend
    updated_at: string; // ISO timestamp from backend
    
    // Computed/helper fields for frontend compatibility
    kind?: "info" | "success" | "warning" | "error";
    ts?: number;
    read?: boolean;
    routeTo?: string;
};

const BACKEND_ON = String(import.meta.env.VITE_ALERTS_BACKEND || "false").toLowerCase() === "true";

// Normalize backend alert response to frontend format
function normalizeAlert(alert: any): ServerAlert {
    const normalized: ServerAlert = {
        id: alert.id,
        level: alert.level,
        title: alert.title,
        message: alert.message,
        route_to: alert.route_to,
        read_flag: alert.read_flag ?? false,
        created_at: alert.created_at,
        updated_at: alert.updated_at,
        
        // Computed fields for compatibility
        kind: mapLevelToKind(alert.level),
        ts: alert.created_at ? new Date(alert.created_at).getTime() : Date.now(),
        read: alert.read_flag ?? false,
        routeTo: alert.route_to,
    };
    return normalized;
}

// Map backend level to frontend kind
function mapLevelToKind(level: string): "info" | "success" | "warning" | "error" {
    const l = (level || "").toLowerCase();
    if (l === "error") return "error";
    if (l === "warn" || l === "warning") return "warning";
    if (l === "success") return "success";
    return "info";
}

async function api_listAlerts(signal?: AbortSignal): Promise<ServerAlert[]> {
    console.log("api_listAlerts");
    const alerts = await fetchJson<any[]>("/api/v1/alerts/me", { signal, metaname: "alerts:list" });
    return alerts.map(normalizeAlert);
}

async function api_markAlertRead(id: string, read: boolean, signal?: AbortSignal) {
    return postJson<ServerAlert>(`/api/v1/alerts/${encodeURIComponent(id)}/read`, { read_flag: read }, { signal, metaname: "alerts/read" });
}

async function api_markAllAlertsRead(signal?: AbortSignal) {
    return putJson<{ updated: number }>(`/api/v1/alerts/mark-all-read`, {}, { signal, metaname: "alerts:readAll" });
}

async function api_createAlert(a: Omit<ServerAlert, "id" | "updated_at">, signal?: AbortSignal) {
    return postJson<ServerAlert>("/api/v1/alerts", a, { signal, metaname: "alerts:create" });
}


const LS_KEY = "mock_server_alerts_v1";

function loadMock(): ServerAlert[] {
    try {
        const raw = localStorage.getItem(LS_KEY);
        if (raw)
            return JSON.parse(raw) as ServerAlert[];
    }
    catch { }
    const now = new Date();
    const past = new Date(Date.now() - 1000 * 60 * 30);
    
    const seed: ServerAlert[] = [
        {
            id: rid(),
            level: "INFO",
            title: "scrape queued",
            message: "Scrape job queued for INC-1001",
            route_to: "/tickets/INC-1001",
            read_flag: false,
            created_at: past.toISOString(),
            updated_at: past.toISOString(),
            kind: "info",
            ts: past.getTime(),
            read: false,
            routeTo: "/tickets/INC-1001",
        },
        {
            id: rid(),
            level: "SUCCESS",
            title: "Eligibility finished",
            message: "EDG run completed for INC-1002",
            route_to: "/tickets/INC-1002",
            read_flag: false,
            created_at: past.toISOString(),
            updated_at: past.toISOString(),
            kind: "success",
            ts: past.getTime(),
            read: false,
            routeTo: "/tickets/INC-1002",
        },
        {
            id: rid(),
            level: "WARNING",
            title: "Datafix required",
            message: "Manual review required for INC-1003",
            route_to: "/tickets/INC-1003",
            read_flag: false,
            created_at: past.toISOString(),
            updated_at: past.toISOString(),
            kind: "warning",
            ts: past.getTime(),
            read: false,
            routeTo: "/tickets/INC-1003",
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
        const now = new Date().toISOString();
        list[i] = { ...list[i], read, read_flag: read, updated_at: now };
        saveMock(list);
        return delay(list[i]);
    }

    const now = new Date();
    const created: ServerAlert = {
        id,
        level: "INFO",
        title: "Unknown Alert",
        message: "This alert was not present in mock store; created runtime",
        route_to: undefined,
        read_flag: read,
        created_at: now.toISOString(),
        updated_at: now.toISOString(),
        kind: "info",
        ts: now.getTime(),
        read,
        routeTo: undefined,
    };

    saveMock([created, ...list]);
    return delay(created);
}

async function mock_markAllAlertsRead(): Promise<{ updated: number }> {
    const list = loadMock();
    let count = 0;
    const now = new Date().toISOString();
    const next = list.map((a) => {
        if (!a.read && !a.read_flag) {
            count++;
            return { ...a, read: true, read_flag: true, updated_at: now };
        }
        return a;
    })
    saveMock(next);
    return delay({ updated: count });
}

async function mock_createAlert(a: Omit<ServerAlert, "id" | "updated_at">): Promise<ServerAlert> {
    const list = loadMock();
    const id = rid();
    const now = new Date();
    const item: ServerAlert = {
        ...a,
        id,
        level: a.level || "INFO",
        created_at: a.created_at || now.toISOString(),
        updated_at: now.toISOString(),
        read_flag: a.read_flag ?? false,
        title: a.title ?? undefined,
        route_to: a.route_to ?? undefined,
        kind: a.kind ?? "info",
        ts: a.ts || now.getTime(),
        read: a.read ?? false,
        routeTo: a.routeTo ?? undefined,
    };
    saveMock([item, ...list].slice(0, 500));
    return delay(item);
}

export async function listAlerts(signal?: AbortSignal): Promise<ServerAlert[]> {
    logApiDirect('listAlerts_start', { backendOn: BACKEND_ON }, 'api/alerts.ts');
    
    try {
        const alerts = await (BACKEND_ON ? api_listAlerts(signal) : mock_listAlerts());
        logApiDirect('listAlerts_success', { 
            count: alerts.length, 
            unread: alerts.filter(a => !a.read).length,
            backendOn: BACKEND_ON 
        }, 'api/alerts.ts');
        return alerts;
    } catch (err) {
        logErrorDirect('listAlerts_error', err, { backendOn: BACKEND_ON });
        throw err;
    }
}

export async function markAllAlertsRead(signal?: AbortSignal) {
    logApiDirect('markAllAlertsRead_start', { backendOn: BACKEND_ON }, 'api/alerts.ts');
    
    try {
        const result = await (BACKEND_ON ? api_markAllAlertsRead(signal) : mock_markAllAlertsRead());
        logApiDirect('markAllAlertsRead_success', { 
            updated: (result as any).updated || (result as any).update,
            backendOn: BACKEND_ON 
        }, 'api/alerts.ts');
        return result;
    } catch (err) {
        logErrorDirect('markAllAlertsRead_error', err, { backendOn: BACKEND_ON });
        throw err;
    }
}

export async function markAlertRead(id: string, read: boolean, signal?: AbortSignal) {
    logApiDirect('markAlertRead_start', { id, read, backendOn: BACKEND_ON }, 'api/alerts.ts');
    
    try {
        const alert = await (BACKEND_ON ? api_markAlertRead(id, read, signal) : mock_markAlertRead(id, read));
        logApiDirect('markAlertRead_success', { id, read, backendOn: BACKEND_ON }, 'api/alerts.ts');
        return alert;
    } catch (err) {
        logErrorDirect('markAlertRead_error', err, { id, read, backendOn: BACKEND_ON });
        throw err;
    }
}

export async function createAlert(a: Omit<ServerAlert, "id" | "updated_at">, signal?: AbortSignal) {
    logApiDirect('createAlert_start', { 
        kind: a.kind, 
        hasRouteTo: !!a.routeTo,
        backendOn: BACKEND_ON 
    }, 'api/alerts.ts');
    
    try {
        const alert = await (BACKEND_ON ? api_createAlert(a, signal) : mock_createAlert(a));
        logApiDirect('createAlert_success', { id: alert.id, backendOn: BACKEND_ON }, 'api/alerts.ts');
        return alert;
    } catch (err) {
        logErrorDirect('createAlert_error', err, { backendOn: BACKEND_ON });
        throw err;
    }
}

export function connectAlertsSSE(url = "/api/v1/alerts/stream") {
    logApiDirect('connectAlertsSSE', { backendOn: BACKEND_ON, url }, 'api/alerts.ts');
    
    if (!BACKEND_ON) {
        logApiDirect('connectAlertsSSE_disabled', { reason: 'backend_off' }, 'api/alerts.ts');
        return null;
    }
    
    try {
        const es = new EventSource(url, { withCredentials: true });
        logApiDirect('connectAlertsSSE_success', { url }, 'api/alerts.ts');
        return es;
    }
    catch (err) {
        logErrorDirect('connectAlertsSSE_error', err, { url });
        return null;
    }
}



