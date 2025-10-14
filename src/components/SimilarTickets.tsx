import { useQuery } from "@tanstack/react-query";
import { getSimilarTickets, SimilarTicket } from "../api/tickets";
import { useLogger } from "../store/logger";
import { Link } from "react-router-dom";
import TicketSection from "./TicketSection";

interface SimilarTicketsProps {
    incidentId: string;
    limit?: number;
}

export default function SimilarTickets({ incidentId, limit = 5 }: SimilarTicketsProps) {
    const { logInfo, logError } = useLogger();

    const { data, isLoading, error } = useQuery({
        queryKey: ["similarTickets", incidentId, limit],
        queryFn: async ({ signal }) => {
            logInfo('SimilarTickets_fetch_started', { incidentId, limit }, 'components/SimilarTickets.tsx');
            try {
                const result = await getSimilarTickets(incidentId, limit, signal);
                logInfo('SimilarTickets_fetch_success', { 
                    incidentId, 
                    count: result.count,
                    topScore: result.similar_tickets[0]?.similarity_score,
                    usingPgvector: true // Backend now uses pgvector
                }, 'components/SimilarTickets.tsx');
                return result;
            } catch (err) {
                logError('SimilarTickets_fetch_error', err, { incidentId, limit });
                throw err;
            }
        },
        enabled: !!incidentId,
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 2, // Retry twice on failure
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000)
    });

    if (isLoading) {
        return (
            <TicketSection title="Similar Tickets">
                <div className="h-32 animate-pulse rounded-lg bg-neutral-200/60 dark:bg-neutral-800/60" />
            </TicketSection>
        );
    }

    if (error || !data || data.count === 0) {
        return null; // Don't show the section if there are no similar tickets
    }

    return (
        <TicketSection title="Similar Tickets">
            <div className="space-y-3">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Found {data.count} similar {data.count === 1 ? 'ticket' : 'tickets'} using vector similarity search
                </p>
                <div className="space-y-2">
                    {data.similar_tickets.map((ticket) => (
                        <SimilarTicketCard key={ticket.incident_id} ticket={ticket} />
                    ))}
                </div>
            </div>
        </TicketSection>
    );
}

interface SimilarTicketCardProps {
    ticket: SimilarTicket;
}

function SimilarTicketCard({ ticket }: SimilarTicketCardProps) {
    const scorePercent = Math.round(ticket.similarity_score * 100);
    
    // Color coding for similarity score
    const getScoreColor = (score: number) => {
        if (score >= 0.7) return 'text-green-600 dark:text-green-400';
        if (score >= 0.4) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-orange-600 dark:text-orange-400';
    };

    const getScoreBgColor = (score: number) => {
        if (score >= 0.7) return 'bg-green-100 dark:bg-green-900/30';
        if (score >= 0.4) return 'bg-yellow-100 dark:bg-yellow-900/30';
        return 'bg-orange-100 dark:bg-orange-900/30';
    };

    return (
        <Link
            to={`/tickets/${ticket.incident_id}`}
            className="block rounded-lg border border-black/5 bg-neutral-50 p-3 transition-all hover:border-blue-300 hover:bg-blue-50 dark:bg-neutral-800/50 dark:hover:border-blue-600 dark:hover:bg-neutral-800"
        >
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-sm font-medium text-blue-600 dark:text-blue-400">
                            {ticket.incident_id}
                        </span>
                        {ticket.category && (
                            <span className="text-xs text-neutral-500 dark:text-neutral-400">
                                {ticket.category}
                                {ticket.subcategory && ` / ${ticket.subcategory}`}
                            </span>
                        )}
                    </div>
                    
                    <p className="text-sm font-medium text-neutral-800 dark:text-neutral-200 line-clamp-2 mb-1">
                        {ticket.summary}
                    </p>
                    
                    {ticket.description && (
                        <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">
                            {ticket.description}
                        </p>
                    )}
                    
                    <div className="flex items-center gap-2 mt-2">
                        {ticket.status && (
                            <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                {ticket.status}
                            </span>
                        )}
                        {ticket.priority && (
                            <span className="inline-flex items-center rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-700 dark:bg-neutral-700 dark:text-neutral-300">
                                {ticket.priority}
                            </span>
                        )}
                    </div>
                </div>
                
                <div className="flex-shrink-0">
                    <div className={`flex items-center justify-center rounded-lg ${getScoreBgColor(ticket.similarity_score)} px-3 py-2`}>
                        <span className={`text-sm font-bold ${getScoreColor(ticket.similarity_score)}`}>
                            {scorePercent}%
                        </span>
                    </div>
                    <p className="text-xs text-center text-neutral-500 dark:text-neutral-400 mt-1">
                        match
                    </p>
                </div>
            </div>
        </Link>
    );
}

