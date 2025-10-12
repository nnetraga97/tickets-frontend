import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate, useParams } from "react-router-dom";
import { getTicketById, Ticket } from "../api/tickets";
import { fmtDate, fmtDateOnly } from "../utils/formatting";
import AttachmentPreview from "../components/AttachmentPreview";
import { scrapeTicket, runElig } from "../api/actions";
import { useEffect, useMemo, useState } from "react";
import { useAlert } from "../store/alert";
import { useLogger } from "../store/logger";
import { useSession } from "../store/session";
import Breadcrumbs from "../components/breadcrumbs";
import { internalStatus, INTERNAL_STATUSES } from "../constants";
import { getInternalStatus, setInternalStatus } from "../store/internalStatus";
import { extractContexts } from "../store/contextExtract";
import { loadCtxFields, saveCtxFields, addCtxItem, removeCtxItem, setCtxSelected } from "../store/contextFields";

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const { push } = useAlert();
    const [menuOpen, setMenuOpen] = useState(false);
    const { logEvent, logInfo, logDebug, logError, logWarn, startTimer } = useLogger();
    const { addVisitedIncident } = useSession();
    const nav = useNavigate();
    const DBEAVER_URL = import.meta.env.VITE_DBEAVER_URL || "/dbeaver";

    // Log component mount
    useEffect(() => {
        logInfo('TicketDetail_mounted', { ticketId: id }, 'pages/TicketDetail.tsx');
        return () => {
            logInfo('TicketDetail_unmounted', { ticketId: id }, 'pages/TicketDetail.tsx');
        };
    }, [id, logInfo]);

    const [ctxList, setCtxList] = useState<string[]>([]);
    const [ctxSelected, setCtxSelectedState] = useState<string | undefined>(undefined);
    const [ctxInput, setCtxInput] = useState("");

    const all = qc.getQueryData<Ticket[]>(["tickets", "all"]) || [];
    const seed = all.find((t) => t.incident_id === id);
    const { data, isLoading, error } = useQuery({
        queryKey: ["ticket", id],
        queryFn: ({ signal }) => getTicketById(id!, signal),
        enabled: !!id,
        initialData: seed,
    });

    // Log data state changes
    useEffect(() => {
        if (isLoading) {
            logDebug('TicketDetail_loading', { ticketId: id }, 'pages/TicketDetail.tsx');
        } else if (error) {
            logError('TicketDetail_load_error', error, { ticketId: id });
        } else if (data) {
            logInfo('TicketDetail_data_loaded', { 
                ticketId: id,
                status: data.status,
                category: data.category,
                hasAttachments: !!data.attachments?.length,
                attachmentCount: data.attachments?.length || 0
            }, 'pages/TicketDetail.tsx');
        }
    }, [isLoading, error, data, id, logDebug, logError, logInfo]);

    const idx = useMemo(() => all.findIndex((t) => t.incident_id === id), [all, id]);
    const total = all.length;
    const prevId = idx > 0 ? all[idx - 1]?.incident_id : undefined;
    const nextId = idx >= 0 && idx < total - 1 ? all[idx + 1]?.incident_id : undefined;

    useEffect(() => {

        if (data?.incident_id) {
            addVisitedIncident(data.incident_id, data.description || data.summary || undefined);
        }
    }, [data?.incident_id]);

    useEffect(() => {
        if (!id)
            return;
        const stored = loadCtxFields(id);
        const auto = extractContexts(data?.summary, data?.description);
        const merged = Array.from(new Set([...(stored.list || []), ...auto]));
        setCtxList(merged);
        setCtxSelectedState(stored.selected);
        if (!stored.selected && auto.length > 0 && !(auto[0] === "-")) {
            setCtxSelectedState(auto[0]);
        }
        saveCtxFields(id, { list: merged, selected: stored.selected });
        const onChange = (e: Event) => {
            const det = (e as CustomEvent).detail as any;
            if (det?.id === id) {
                const s = loadCtxFields(id);
                setCtxList(s.list);
                setCtxSelectedState(s.selected);
            }
        };
        window.addEventListener("ctxf-changed", onChange as any);
        return () => window.removeEventListener("ctxf-changed", onChange as any);
    }, [id, data?.summary, data?.description]);

    const onAddCtx = () => {
        if (!id)
            return;
        const v = ctxInput.trim();
        if (!v)
            return;
        
        logInfo('TicketDetail_context_added', { 
            ticketId: id,
            contextValue: v
        }, 'pages/TicketDetail.tsx');
        
        addCtxItem(id, v);
        setCtxInput("");
    }

    const onRemoveCtx = (v: string) => {
        if (!id)
            return;
        
        logInfo('TicketDetail_context_removed', { 
            ticketId: id,
            contextValue: v
        }, 'pages/TicketDetail.tsx');
        
        removeCtxItem(id, v);
    }

    const onSelectCtx = (v?: string) => {
        if (!id)
            return;
        
        logDebug('TicketDetail_context_selected', { 
            ticketId: id,
            contextValue: v
        }, 'pages/TicketDetail.tsx');
        
        setCtxSelectedState(v || undefined);
        setCtxSelected(id, v || undefined);
    }

    const openDBeaver = () => {
        logInfo('TicketDetail_dbeaver_opened', { 
            ticketId: id,
            url: DBEAVER_URL
        }, 'pages/TicketDetail.tsx');
        
        window.open(DBEAVER_URL, "_blank", "noopener,noreferrer");
    };

    const workKey = useMemo(() => (id ? `workarea:${id}` : ""), [id]);
    const [work, setWork] = useState<string>("");

    useEffect(() => {
        if (workKey) {
            try {
                setWork(localStorage.getItem(workKey) || "");
            } catch {
                setWork("");
            }
        }
    }, [workKey]);

    const saveWork = (val: string) => {
        setWork(val);
        try {
            localStorage.setItem(workKey, val);
        } catch { }
    };

    const [internal, setInternal] = useState<internalStatus | "">("");
    useEffect(() => {
        if (id)
            setInternal((getInternalStatus(id as any) || ""));

        const onChange = (e: Event) => {
            const det = (e as CustomEvent).detail as any;
            if (det?.id === id)
                setInternal(det.value || "");
        };
        window.addEventListener("internal-status-change", onChange as any);
        return () => window.removeEventListener("interal-status-change", onChange as any);
    }, [id]);

    const updateInternal = (val: internalStatus | "") => {
        logInfo('TicketDetail_internal_status_changed', { 
            ticketId: id,
            newStatus: val,
            previousStatus: internal
        }, 'pages/TicketDetail.tsx');
        
        setInternal(val);
        if (id)
            setInternalStatus(id, val || undefined);
    }


    if (isLoading) return <Skeleton />;
    if (error || !data) return <NotFound id={id!} />;

    const t = data as Ticket;

    async function onScrape() {
        const timer = startTimer('scrape_ticket');
        logInfo('TicketDetail_scrape_started', { ticketId: t.incident_id }, 'pages/TicketDetail.tsx');
        
        try {
            logEvent("scrape_click", { action: "scrape", id: t.incident_id })
            const res = await scrapeTicket(t.incident_id);
            const duration = timer.end();
            
            logInfo('TicketDetail_scrape_queued', { 
                ticketId: t.incident_id,
                jobId: res.job_id,
                duration_ms: duration
            }, 'pages/TicketDetail.tsx');
            
            // Job is queued - user will get alert updates via SSE
            push({ 
                kind: "info", 
                title: "Job Queued", 
                message: res.message,
                toInbox: false 
            });
        }
        catch (e) {
            const duration = timer.end();
            logError('TicketDetail_scrape_failed', e, { 
                ticketId: t.incident_id,
                duration_ms: duration
            });
            push({ kind: "error", title: "Failed to queue job", message: String((e as Error).message || e) });
        }
    }

    async function onElig(target: "edg" | "edbc") {
        const timer = startTimer(`elig_${target}`);
        logInfo('TicketDetail_elig_started', { 
            ticketId: t.incident_id,
            target
        }, 'pages/TicketDetail.tsx');
        
        try {
            logEvent("elig_click", { action: `elig_${target}`, id: t.incident_id })
            const res = await runElig(t.incident_id, target);
            const duration = timer.end();
            
            logInfo('TicketDetail_elig_queued', { 
                ticketId: t.incident_id,
                target,
                jobId: res.job_id,
                duration_ms: duration
            }, 'pages/TicketDetail.tsx');
            
            // Job is queued - user will get alert updates via SSE
            push({ 
                kind: "info", 
                title: "Job Queued", 
                message: res.message,
                toInbox: false 
            });
        }
        catch (e) {
            const duration = timer.end();
            logError('TicketDetail_elig_failed', e, { 
                ticketId: t.incident_id,
                target,
                duration_ms: duration
            });
            push({ kind: "error", title: "Failed to queue job", message: String((e as Error).message || e) });
        }
    }
    return (
        <div className="mx-auto max-w-4xl space-y-6">
            <Breadcrumbs
                items={[
                    { label: "Home", to: "/" },
                    { label: "Tickets", to: "/" },
                    { label: t.category ? `${t.category}` : "Detail" },
                    { label: t.incident_id },
                ]}
            />
            <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3 text-sm dark:bg-neutral-900">
                <div className="flex items-center gap-2">
                    <span className="font-medium">Ticket</span>
                    <span className="font-mono">{idx >= 0 ? idx + 1 : "?"}</span>of
                    <span className="font-mono">{total || "0"}</span>
                </div>
                <div className="flex items center gap-2">
                    <button
                        onClick={() => prevId && nav(`/tickets/${encodeURIComponent(prevId)}`)}
                        disabled={!prevId}
                        className="rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        <svg width="50%" height="10%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M20.6621 17C18.933 19.989 15.7013 22 11.9999 22C6.47703 22 1.99988 17.5228 1.99988 12C1.99988 6.47715 6.47703 2 11.9999 2C15.7013 2 18.933 4.01099 20.6621 7M11.9999 8L7.99995 12M7.99995 12L11.9999 16M7.99995 12H21.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>Prev
                    </button>
                    <button
                        onClick={() => nextId && nav(`/tickets/${encodeURIComponent(nextId)}`)}
                        disabled={!nextId}
                        className="rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                        Next<svg width="50%" height="15%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3.33789 7C5.06694 4.01099 8.29866 2 12.0001 2C17.5229 2 22.0001 6.47715 22.0001 12C22.0001 17.5228 17.5229 22 12.0001 22C8.29866 22 5.06694 19.989 3.33789 17M12 16L16 12M16 12L12 8M16 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </button>
                </div>
            </div>
            <header className="flex items-center justify-between">
                <h1 className="text-2xl font-semibold">
                    {t.incident_id} <span className="ml-2 text-sm text-neutral-500">{t.status}</span>
                </h1>
                <h1 className="text-2xl font-semibold">
                    <select value={internal} onChange={(e) => updateInternal((e.target.value || "") as internalStatus | "")}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800 overflow-auto">
                        <option value="">-</option>
                        {INTERNAL_STATUSES.map((s) => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                    </select>
                </h1>
                <div className="relative">
                    <button
                        onClick={() => setMenuOpen((v) => !v)}
                        data-action="ticket_options_toggle"
                        className="rounded-xl bg-black px-3 py-1.5 text-sm text-white transition hover:opacity-90 dark:bg-white dark:text-black">
                        Options 🔻
                    </button>
                    {menuOpen && (
                        <div
                            className="absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-soft-lg dark:border-white/10 dark:bg-neutral-900"
                            onMouseLeave={() => setMenuOpen(false)}
                        >
                            <MenuIem label="Scrape for Latest" onClick={onScrape} data-action="scrape_options_toggle" />
                            <MenuIem label="Search for similar" onClick={onScrape} data-action="simillar_options_toggle" />
                            <div className="my-1 border-t border-black/10 dark:border-white/10" />
                            <MenuIem label="View case in Support" onClick={onScrape} data-action="support_options_toggle" />
                            <MenuIem label="View case in Patch" onClick={onScrape} data-action="patch_options_toggle" />
                            <MenuIem label="View case in Prod" onClick={onScrape} data-action="prod_options_toggle" />
                            <div className="my-1 border-t border-black/10 dark:border-white/10" />
                            <SubHeader>Run case in Aspen Supp➡️</SubHeader>
                            <MenuIem label="Edg" onClick={() => onElig("edg")} data-action="edgrun_options_toggle" />
                            <MenuIem label="Edbc" onClick={() => onElig("edbc")} data-action="edbc_options_toggle" />
                            <div className="my-1 border-t border-black/10 dark:border-white/10" />
                            <MenuIem label="View Logs" disabled data-action="viewlogs_options_toggle" />
                            <MenuIem label="View Dbeaver" disabled data-action="opt_open_dbeaver" />
                        </div>
                    )}
                </div>
            </header>
            <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-semibold">Summary</h2>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.summary}</p>
            </section>

            <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-semibold">Description</h2>
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.description}</p>
            </section>
            <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-semibold">Context Fields</h2>
                <div className="mb-3 flex items-center gap-2">
                    <label className="text-sm opacity-70">Selected</label>
                    <select
                        value={ctxSelected || ""}
                        onChange={(e) => onSelectCtx(e.target.value || undefined)}
                        className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800"
                    >
                        <option value="">-</option>
                        {ctxList.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                    {ctxSelected && <span className="text-xs text-neutral-500">Saved for {t.incident_id}</span>}
                </div>

                <div className="mb-3 flex flex-wrap gap-2">
                    {ctxList.length === 0 && <span className="text-sm text-neutral-500">No contexts</span>}
                    {ctxList.map((c) => (
                        <span key={c} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${c === ctxSelected ? "border-black bg-black text-white dark:bg-white dark:text-black" : "border-black/10 bg-neutral-50 dark:neutral-800"}`}>
                            <span className="font-mono">{c}</span>
                            <button
                                title="Remove"
                                onClick={() => onRemoveCtx(c)}
                                className="rounded-full px-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                            >
                                x
                            </button>
                        </span>
                    ))}
                </div>

                <div className="flex items-center gap-2">
                    <input value={ctxInput}
                        onChange={(e) => setCtxInput(e.target.value)}
                        placeholder="Add context"
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800"
                    />
                    <button
                        onClick={onAddCtx}
                        className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:opdacity-90 dark:bg-white dark:text-black"
                    >
                        Add
                    </button>
                </div>
            </section>
            <section className="grid gap-4 md:grid-cols-2">
                <Info label="Incident Type" value={t.incident_type} />
                <Info label="Priority" value={t.priority} />
                <Info label="Owned By" value={t.owned_by} />
                <Info label="Category" value={t.category} />
                <Info label="SubCategory" value={t.subcategory} />
                <Info label="Service" value={t.service} />
                <Info label="Created By" value={t.created_by} />
                <Info label="Resolved By" value={t.resolved_by} />
                <Info label="Customer" value={t.customer_name} />
                <Info label="Created" value={fmtDate(t.created_date)} />
                <Info label="Last Modified" value={fmtDate(t.last_modified_date)} />
                <Info label="Closed" value={t.closed_date ? fmtDate(t.closed_date) : ""} />
            </section>



            {t.resolution && (
                <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                    <h2 className="mb-2 text-lg font-semibold">Resolution</h2>
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.resolution}</p>
                </section>
            )}

            {t.journal_notes && (
                <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                    <h2 className="mb-2 text-lg font-semibold">Journal</h2>
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.journal_notes}</p>
                </section>)}
            <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-semibold">Attachments</h2>
                {t.attachments?.length === 0 && <p className="text-sm text-neutral-500">No Attachments</p>}
                <div className="grid gap-4 md:grid-cols-3">
                    {t.attachments?.map((a) => (
                        <AttachmentPreview key={a.key} attachmentKey={a.key} filename={a.filename ? a.filename : ""} />
                    ))}
                </div>
            </section>
            <section className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
                <h2 className="mb-2 text-lg font-semibold">WorkArea</h2>
                <p className="mb-2 text-xs text-neutral-500">
                    Notes here are saved locally for this ticket (<span className="font-mono">{t.incident_id}</span>).
                </p>
                <textarea
                    value={work}
                    onChange={(e) => saveWork(e.target.value)}
                    className="h-40 w-full resize-vertical rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-black/30 dark:bg-neutral-800"
                    placeholder="Write/paste anything..."
                />
                <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                    <span>{work.length} chars</span>
                    <button
                        onClick={() => saveWork("")}
                        className="rounded-lg px-2 py-1 hover:ng-neutral-100 dark:hover:bg-neutral-800"
                    >
                        Clear
                    </button>
                </div>
            </section>
        </div>
    );
}

function Info({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-1 text-sm">{value || "-"}</div>
        </div>
    );
}

function MenuIem({ label, onClick, disabled = false, dataAction }: { label: string; onClick?: () => void; disabled?: boolean; dataAction?: string }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            data-action={dataAction || `menuitem_${label.toLowerCase().trim().replace(/\s+/g, "_")}`}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${disabled
                ? "opacity-50"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                }`}
        >
            {label}
        </button>
    );
}

function SubHeader({ children }: { children: React.ReactNode }) {
    return <div className="px-2 py-1 text-xs uppercase tracking-wide text-neutral-500">{children}</div>
}

function Skeleton() {
    return <div className="h-40 animate-pulse rounded-2xl bg-neutral-200/60 dark:bg-neutral-800/60" />;
}

function NotFound({ id }: { id: string }) {
    return (
        <div className="rounded-2xl border-black/5 bg-white p-6 text-center dark:bg-neutral-900">
            Ticket <span className="font-mono">{id}</span> not found.
        </div>
    )
}