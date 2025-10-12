import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";
import { useLogger } from "./logger";
export type AlertKind = "info" | "success" | "warning" | "error";

export type AlertItem = {
    id: string;
    title?: string;
    message: string;
    kind?: AlertKind;
    routeTo?: string;
}

export type InboxItem = {
    id: string;
    ts: number;
    title?: string;
    message: string;
    kind?: AlertKind;
    routeTo?: string;
    read: boolean;
}


type AlertCtx = {
    push: (a: Omit<AlertItem, "id"> & { id?: string; toInbox?: boolean }) => string;
    remove: (id: string) => void;
    items: AlertItem[];

    inbox: InboxItem[];
    unreadCount: number;
    markRead: (id: string) => void;
    markAllRead: () => void;
    clearInbox: () => void;
}

const DefaultCtx: AlertCtx = {
    items: [],
    push: () => "",
    remove: () => { },
    inbox: [],
    unreadCount: 0,
    markRead: () => { },
    markAllRead: () => { },
    clearInbox: () => { },
};

const SS_INBOX = "tickets_alert_inbox_v1";

const Ctx = createContext<AlertCtx>(DefaultCtx);
function rid() {
    return Math.random().toString(36).slice(2, 10);
}


export function AlertProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<AlertItem[]>([]);
    const timers = useRef<Map<string, any>>(new Map());
    const { logEvent, logInfo, logDebug } = useLogger();

    const [inbox, setInbox] = useState<InboxItem[]>(() => {
        try {
            const raw = sessionStorage.getItem(SS_INBOX);
            const parsed = raw ? (JSON.parse(raw) as InboxItem[]) : [];
            logDebug('AlertProvider_inbox_restored', { 
                inboxCount: parsed.length,
                unreadCount: parsed.filter(x => !x.read).length
            }, 'store/alert.tsx');
            return parsed;
        }
        catch (err) {
            logInfo('AlertProvider_inbox_restore_failed', { 
                error: String(err)
            }, 'store/alert.tsx');
            return [];
        }
    });

    const persistInbox = (next: InboxItem[]) => {
        setInbox(next);
        try {
            sessionStorage.setItem(SS_INBOX, JSON.stringify(next));
        }
        catch {

        }
    }

    const remove = useCallback((id: string) => {
        logDebug("alert_remove", { id }, 'store/alert.tsx');
        logEvent("alert_remove", { action: "alert", id: id })
        
        setItems((list) => list.filter((x) => x.id !== id));
        const t = timers.current.get(id);
        if (t) {
            clearTimeout(t);
            timers.current.delete(id);
        }
    }, [logDebug, logEvent]);

    const push: AlertCtx["push"] = useCallback((a) => {
        const id = a.id || rid();
        const item: AlertItem = { id, kind: "info", ...a };
        
        logInfo("alert_pushed", { 
            id,
            kind: item.kind,
            hasTitle: !!item.title,
            hasRouteTo: !!item.routeTo,
            toInbox: a.toInbox !== false,
            messageLength: item.message.length
        }, 'store/alert.tsx');
        
        logEvent("alert_added", { action: "alert", id: a.id })
        setItems((list) => [...list, item]);

        const t = setTimeout(() => remove(id), 5000);
        timers.current.set(id, t);

        if (a.toInbox !== false) {
            const entry: InboxItem = {
                id,
                ts: Date.now(),
                title: item.title,
                message: item.message,
                kind: item.kind,
                routeTo: item.routeTo,
                read: false,
            };
            persistInbox([entry, ...inbox].slice(0, 20));
        }
        return id;
    }, [inbox, remove, logInfo, logEvent]);

    const markRead: AlertCtx["markRead"] = (id) => {
        logDebug("alert_mark_read", { id }, 'store/alert.tsx');
        persistInbox(inbox.map((x) => (x.id === id ? { ...x, read: true } : x)));
    }

    const markAllRead: AlertCtx["markAllRead"] = () => {
        const unreadCount = inbox.filter(x => !x.read).length;
        logInfo("alert_mark_all_read", { 
            totalCount: inbox.length,
            markedCount: unreadCount
        }, 'store/alert.tsx');
        persistInbox(inbox.map((x) => ({ ...x, read: true })));
    }

    const clearInbox: AlertCtx["clearInbox"] = () => {
        logInfo("alert_clear_inbox", { 
            clearedCount: inbox.length
        }, 'store/alert.tsx');
        persistInbox([]);
    }

    const unreadCount = useMemo(() => inbox.filter((x) => !x.read).length, [inbox]);


    const value = useMemo(() => ({ items, push, remove, inbox, unreadCount, markRead, markAllRead, clearInbox }), [items, push, remove, inbox, unreadCount],);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>

}

export function useAlert() {
    return useContext(Ctx);
}