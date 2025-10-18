import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { getTicketById, Ticket } from "../api/tickets";
import { scrapeTicket, runElig } from "../api/actions";
import { useEffect, useMemo, useState } from "react";
import { useAlert } from "../store/alert";
import { useLogger } from "../store/logger";
import { useSession } from "../store/session";
import Breadcrumbs from "../components/breadcrumbs";
import { internalStatus } from "../constants";
import { getInternalStatus, setInternalStatus } from "../store/internalStatus";
import TicketNavigation from "../components/TicketNavigation";
import TicketHeader from "../components/TicketHeader";
import ContextFieldsSection from "../components/ContextFieldsSection";
import AttachmentsSection from "../components/AttachmentsSection";
import WorkareaSection from "../components/WorkareaSection";
import TicketInfoGrid from "../components/TicketInfoGrid";
import TicketSection from "../components/TicketSection";
import SimilarTickets from "../components/SimilarTickets";

export default function TicketDetail() {
    const { id } = useParams<{ id: string }>();
    const qc = useQueryClient();
    const { push } = useAlert();
    const { logEvent, logInfo, logError, startTimer } = useLogger();
    const { addVisitedIncident } = useSession();

    const all = qc.getQueryData<Ticket[]>(["tickets", "all"]) || [];
    const seed = all.find((t) => t.incident_id === id);
    const { data, isLoading, error } = useQuery({
        queryKey: ["ticket", id],
        queryFn: ({ signal }) => getTicketById(id!, signal),
        enabled: !!id,
        initialData: seed,
    });

    const idx = useMemo(() => all.findIndex((t) => t.incident_id === id), [all, id]);
    const total = all.length;
    const prevId = idx > 0 ? all[idx - 1]?.incident_id : undefined;
    const nextId = idx >= 0 && idx < total - 1 ? all[idx + 1]?.incident_id : undefined;

    useEffect(() => {
        if (data?.incident_id) {
            addVisitedIncident(data.incident_id, data.description || data.summary || undefined);
        }
    }, [data?.incident_id, addVisitedIncident, data?.description, data?.summary]);

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

    const handleScrape = async () => {
        if (!data) return;
        const timer = startTimer('scrape_ticket');
        logInfo('TicketDetail_scrape_started', { ticketId: data.incident_id }, 'pages/TicketDetail.tsx');
        
        try {
            logEvent("scrape_click", { action: "scrape", id: data.incident_id })
            const res = await scrapeTicket(data.incident_id);
            const duration = timer.end();
            
            logInfo('TicketDetail_scrape_queued', { 
                ticketId: data.incident_id,
                jobId: res.job_id,
                duration_ms: duration
            }, 'pages/TicketDetail.tsx');
            
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
                ticketId: data.incident_id,
                duration_ms: duration
            });
            push({ kind: "error", title: "Failed to queue job", message: String((e as Error).message || e) });
        }
    };

    const handleElig = async (target: "edg" | "edbc") => {
        if (!data) return;
        const timer = startTimer(`elig_${target}`);
        logInfo('TicketDetail_elig_started', { 
            ticketId: data.incident_id,
            target
        }, 'pages/TicketDetail.tsx');
        
        try {
            logEvent("elig_click", { action: `elig_${target}`, id: data.incident_id })
            const res = await runElig(data.incident_id, target);
            const duration = timer.end();
            
            logInfo('TicketDetail_elig_queued', { 
                ticketId: data.incident_id,
                target,
                jobId: res.job_id,
                duration_ms: duration
            }, 'pages/TicketDetail.tsx');
            
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
                ticketId: data.incident_id,
                target,
                duration_ms: duration
            });
            push({ kind: "error", title: "Failed to queue job", message: String((e as Error).message || e) });
        }
    };
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
            
            <TicketNavigation 
                currentIndex={idx}
                total={total}
                prevId={prevId}
                nextId={nextId}
            />
            
            <TicketHeader
                incidentId={t.incident_id}
                status={t.status}
                internalStatus={internal}
                onInternalStatusChange={updateInternal}
                onScrape={handleScrape}
                onElig={handleElig}
            />
            
            <TicketSection title="Summary">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.summary}</p>
            </TicketSection>

            <TicketSection title="Description">
                <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.description}</p>
            </TicketSection>
            
            <ContextFieldsSection 
                incidentId={t.incident_id}
                summary={t.summary}
                description={t.description}
            />
            
            <TicketInfoGrid ticket={t} />

            {t.resolution && (
                <TicketSection title="Resolution">
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.resolution}</p>
                </TicketSection>
            )}

            {t.journal_notes && (
                <TicketSection title="Journal">
                    <p className="whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-200">{t.journal_notes}</p>
                </TicketSection>
            )}
            
            <AttachmentsSection incidentId={t.incident_id} />
            
            <WorkareaSection incidentId={t.incident_id} />
            
            <SimilarTickets incidentId={t.incident_id} limit={5} />
        </div>
    );
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