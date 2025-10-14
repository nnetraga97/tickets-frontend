import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useLogger } from "../store/logger";
import { useSearch } from "../store/search";
import { useSession } from "../store/session";
import Notifications from "./Notifications";
import AccountMenu from "./AccountMenu";

export default function NavBar() {
    const [open, setOpen] = useState(false);
    const [histOpen, setHistOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement | null>(null);
    const historyRef = useRef<HTMLDivElement | null>(null);
    const { q, setQ } = useSearch();
    const nav = useNavigate();
    const loc = useLocation();
    const { history, clearHistory } = useSession();
    const { logInfo, logDebug } = useLogger();

    // Log navigation changes
    useEffect(() => {
        logDebug('NavBar_location_changed', { 
            pathname: loc.pathname,
            search: loc.search
        }, 'components/NavBar.tsx');
        setOpen(false); 
        setHistOpen(false);
    }, [loc.pathname, loc.search, logDebug]);
    
    useEffect(() => {
        function onDoc(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node))
                setOpen(false);
            if (historyRef.current && !historyRef.current.contains(e.target as Node))
                setHistOpen(false);
        }

        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    const submitSearch = (e: React.FormEvent) => {
        e.preventDefault();
        logInfo('NavBar_search_submitted', { 
            query: q,
            queryLength: q.length
        }, 'components/NavBar.tsx');
        nav("/", { replace: false });
    }
    return (
        <header className="sticky top-0 z-40 border-b border-white/20 dark:border-white/10">
            <div
                className="glass bg-gradient-to-r from-sky-50/70 via-indigo-50/70 to-violet-50/70 
                dark:from-neutral-900/70 dark:via-neutral-900/70 dark:to-neutral-900/70 
                backdrop-blur-md"
                style={{ "--glass": "rgba(255, 255, 255, 0.6)" } as React.CSSProperties}
            >
                <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
                    <Link to="/" className="font-semibold tracking-tight text-lg">
                        Tickets
                    </Link>
                    <div className="flex items-center gap-1">
                        <NavItem to="/">Home</NavItem>
                        <NavItem to="/tier1">Tier 1</NavItem>
                        <NavItem to="/tier2">Tier 2</NavItem>
                        <NavItem to="/daily">Daily</NavItem>
                        <NavItem to="/category">By Category</NavItem>
                        <NavItem to="/subcategory">By Subcategory</NavItem>
                    </div>
                    <form onSubmit={submitSearch} className="ml-auto flex min-w-[220px] flex-1 justify-end">
                        <div className="flex w-full max-w-md items-center gap-2 rounded-xl border border-black/10 bg-white/70 px-2 py-1.5 text-sm shadow-sm focus-within:border-black/30 dark:bg-neutral-800/70">
                            <span className="opacity-60">🔍</span>
                            <input
                                value={q}
                                data-action="nav_search_input"
                                onChange={(e) => setQ(e.target.value)}
                                placeholder="Search Tickets..."
                                className="w-full bg-transparent outline-none"
                            />
                            {q && (
                                <button
                                    type="button"
                                    title="Clear"
                                    onClick={() => setQ("")}
                                    className="rounded-md px-1 text-xs opacity-60 hover:opacity-100"
                                >
                                    x
                                </button>
                            )}
                        </div>
                    </form>
                    <div ref={historyRef} className="relative">
                        <button
                            onClick={() => setHistOpen((v) => !v)}
                            data-action="history_toggle"
                            className="ml-2 rounded-xl px-3 py-1.5 text-sm transition hover:bg-black/10 dark:hover:bg-white/10"
                            title="Recently viewed tickets"
                        >History 🔻
                        </button>
                        {histOpen && (
                            <div
                                className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-soft-lg dark:border-white/10 dark:bg-neutral-900"
                            >
                                <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">
                                    Recently Viewed ({history.length})
                                </div>
                                <div className="max-h-[50vh] overflow-auto">
                                    {history.length === 0 && (
                                        <div className="px-2 py-3 text-sm text-neutral-500">None this session.</div>
                                    )}
                                    {history.map((h) => (
                                        <button
                                            key={h.id}
                                            data-action={`history_item_${h.id}`}
                                            onClick={() => nav(`/tickets/${encodeURIComponent(h.id)}`)}
                                            className="block w-full rounded-lg px-2 py-2 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="font-medium">{h.id}</div>
                                                <div className="text-ts text-neutral-500">{new Date(h.ts).toLocaleString()}</div>
                                            </div>
                                            {h.label && <div className="mt-0.5 line-clamp-2 text-xs opacity-80">{h.label}</div>}
                                        </button>
                                    ))}
                                </div>
                                {history.length > 0 && (
                                    <div className="mt-2 border-t border-black/10 pt-2 dark:border-white/10">
                                        <button
                                            data-action="history_clear"
                                            onClick={clearHistory}
                                            className="w-full rounded-lg bg-neutral50 px-2 py-1.5 text-sm hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                        >Clear History</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    <div ref={menuRef} className="relative">
                        <button
                            onClick={() => setOpen((v) => !v)}
                            data-action="menu_toggle"
                            className="ml-2 rounded-xl px-3 py-1.5 text-sm transition hover:bg-black/10 dark:hover:bg-white/10"
                        >Menu 🔻
                        </button>
                        {open && (
                            <div
                                className="absolute right-0 mt-2 w-[320px] overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-soft-lg dark:border-white/10 dark:bg-neutral-900"
                                role="menu"
                            >
                                <Section title="Log Viewer">
                                    <Item to="/logs" label="Open log viewer" />
                                </Section>

                                <Section title="Resources">
                                    <Item href="#" label="Aspen Wiki" />
                                </Section>

                                <Section title="Environments(Aspen+)">
                                    <Item href="#" label="Aspen Wiki" />
                                </Section>
                                <Section title="Environments(Aspen)">
                                    <Item href="#" label="Aspen Wiki" />
                                </Section>
                                <Section title="Application Diagnostics">
                                    <Item to="/logs" label="Application Logs" />
                                    <Item to="/perf" label="Performace Metrics" />
                                </Section>
                            </div>
                        )}
                    </div>
                    <Notifications />
                    <AccountMenu />
                </nav>
            </div>
        </header>
    );
}

function NavItem({ to, children }: { to: string; children: React.ReactNode }) {
    const location = useLocation();

    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `rounded-xl px-3 py-1.5 text-sm transition ${isActive
                    ? "bg-black text-white dark:bg-white dark:text-black"
                    : "hover:bg-black/10 dark:hover:bg-white/10"
                }`
            }
        >
            {children}
        </NavLink>
    );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-2 rounded-xl bg-neutral-50 p-2 dark:bg-neutral-800/60">
            <div className="mb-1 px-1 text-[11px] font-semibold uppercase tracking-wide text-neutral-500">{title}</div>
            <div className="flex flex-col">{children}</div>
        </div>
    )
}

function Item({ to, href, label }: { to?: string; href?: string; label: string }) {
    if (to) {
        return (
            <NavLink
                to={to}
                data-action={`menu_${label.toLowerCase().replace(/\s+/g, "_")}`}
                className="rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover-bg-neutral-700/50">
                {label}
            </NavLink>
        );
    }
    return (
        <a
            data-action={`menu_${label.toLowerCase().replace(/\s+/g, "_")}`}
            href={href || "#"}
            className="rounded-lg px-2 py-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
            target={href?.startsWith("http") ? "_blank" : undefined}
            rel="noreferrer"
        >
            {label}
        </a>
    )
}