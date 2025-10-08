import { useEffect, useRef, useState } from "react";
import { useAlertsLive } from "../store/alertsLive";
import { useAlert } from "../store/alert";
import { useNavigate } from "react-router-dom";

export default function Notifications() {
    const { alerts, unreadCount, markRead, markAllRead, isServerEnabled } = useAlertsLive();
    const { inbox } = useAlert();
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const nav = useNavigate();

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const data = isServerEnabled ? alerts : inbox.map((x) => ({ id: x.id, ts: x.ts, title: x.title, message: x.message, kind: x.kind, routeTo: x.routeTo, read: x.read }))
        .sort((a, b) => b.ts - a.ts);


    const unread = data.filter((x) => !x.read);
    const read = data.filter((x) => x.read);

    const onClickItem = (id: string, routeTo?: string) => {
        if (isServerEnabled)
            markRead(id);
        if (routeTo) nav(routeTo);
        setOpen(false);
    };

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                data-action="notification_toggle"
                className="ml-2 relative rounded-xl px-2 py-1.5 text-sm transition hover:bg-black/10 dark:hover:bg-white/10"
                title="Notifications"
            >
                <BellIcon />
                {(isServerEnabled ? unreadCount : unread.length) > 0 && (
                    <span className="absolute -right-0 -top-0 rounded-full bg-red-600 px-1.5 text-[10px] font-bold leading-4 text-white">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 mt-2 w-[380px] overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shaodow-soft-lg dark:border-white/10 dark:bg-neutral-900">
                    <div className="mb-1 flex items-center justify-between px-1">
                        <div className="text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                            Notifications
                        </div>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllRead()}
                                className="rounded-md px-2 py-0.5 text-xs hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                            >
                                Mark All Read
                            </button>
                        )}
                    </div>

                    <Section title={`Unread (${unread.length})`}>
                        {unread.length === 0 && (
                            <EmptyRow label="Nothing new." />
                        )}
                        {unread.map((n) => (
                            <Row key={n.id} onClick={() => onClickItem(n.id, n.routeTo ?? undefined)}>
                                <Title kind={n.kind ?? undefined} title={n.title || "Alert"} />
                                <Msg msg={n.message} />
                                <Ts ts={n.ts} />
                            </Row>
                        ))}
                    </Section>
                    <Section title={`Read (${read.length})`}>
                        {read.length === 0 && (
                            <EmptyRow label="-" />
                        )}
                        {read.map((n) => (
                            <Row key={n.id} onClick={() => onClickItem(n.id, n.routeTo || undefined)} dim>
                                <Title kind={n.kind || undefined} title={n.title || "Alert"} />
                                <Msg msg={n.message} />
                                <Ts ts={n.ts} />
                            </Row>
                        ))}
                    </Section>
                </div >
            )}
        </div >
    );
}

function Section({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="mb-2 rounded-xl bg-neutral-50 p-2 dark:bg-neutral-800/60">
            <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                {title}
            </div>
            <div className="flex max-h-[40vh] flex-col gap-1 overflow-y-auto">{children}</div>
        </div>
    );
}

function Row({ children, onClick, dim }: { children: React.ReactNode; onClick: () => void; dim?: boolean }) {
    return (
        <button
            onClick={onClick}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/50 ${dim ? "opacity-60" : ""
                }`}
        >
            {children}
        </button>
    );
}

function Title({ kind, title }: { kind?: string; title: string }) {
    return (
        <div className="mb-0.5 flex items-center gap-2">
            <span>{icon(kind)}</span>
            <span className="font-medium">{title}</span>
        </div>
    );
}

function Msg({ msg }: { msg: string }) {
    return <div className="line-clamp-2 text-xs opacity-90">{msg}</div>
}

function Ts({ ts }: { ts: number }) {
    return <div className="mt-0.5 text-[11px] text-neutral-500">{new Date(ts).toLocaleString()}</div>
}

function EmptyRow({ label }: { label: string }) {
    return <div className="ps-2 py-2 text-sm text-neutral-500">{label}</div>;
}

function BellIcon() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" className="inline-block align-middle">
            <path
                fill="currentColor"
                d="M12 22a2 2 0 0 0 1.995-1.85L14 20h-4a2 2 0 0 0 1.85 1.995L12 22Zm6-6V11a6 6 0 1 0-12 ov5l-2 2v1h18v-1l-2-2Z"
            />
        </svg>
    )
}

function icon(k?: string) {
    switch (k) {
        case "success":
            return "✅";
        case "warning":
            return "⚠️";
        case "error":
            return "🛑";
        default:
            return "🔔";
    }
}