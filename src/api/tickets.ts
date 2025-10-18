import { fetchJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

export type Attachment = { key: string; filename?: string };
export type Ticket = {
    incident_id: string;
    incident_type: string;
    status: string;
    priority: string;
    description: string;
    subcategory: string;
    category: string;
    created_date: string;
    summary: string;
    created_by: string;
    closed_date?: string;
    service?: string;
    last_modified_date: string;
    customer_name?: string;
    resolution?: string;
    journal_notes?: string;
    attachments?: Attachment[];
    resolved_by?: string;
    owned_by?: string;
    internal_status?: string;
    context_fields?: string[];
};

const USE_MOCK = String(import.meta.env.VITE_USE_MOCK).toLowerCase() === 'true';

export async function getAllTickets(signal?: AbortSignal): Promise<Ticket[]> {
    logApiDirect('getAllTickets_start', { useMock: USE_MOCK }, 'api/tickets.ts');
    
    try {
        const response = await fetchJson<{ items: Ticket[], page: any }>('/api/tickets', { signal, metaname: 'getAllTickets' });
        const tickets = response.items || [];
        logApiDirect('getAllTickets_success', { 
            count: tickets.length,
            categories: new Set(tickets.map(t => t.category)).size,
            statuses: new Set(tickets.map(t => t.status)).size
        }, 'api/tickets.ts');
        return tickets;
    } catch (err) {
        logErrorDirect('getAllTickets_error', err, { useMock: USE_MOCK });
        throw err;
    }
}

export async function getTicketById(id: string, signal?: AbortSignal): Promise<Ticket> {
    logApiDirect('getTicketById_start', { id, useMock: USE_MOCK }, 'api/tickets.ts');
    
    try {
        if (USE_MOCK) {
            logApiDirect('getTicketById_mock_mode', { id }, 'api/tickets.ts');
            const response = await fetchJson<{ items: Ticket[], page: any }>("/api/tickets", {
                signal,
                metaname: "getAllTicketsForId",
            });
            const all = response.items || [];
            const one = all.find((t) => t.incident_id === id);
            
            if (!one) {
                logErrorDirect('getTicketById_not_found', new Error("Not_found"), { 
                    id, 
                    totalTickets: all.length 
                });
                const err: any = new Error("Not_found");
                err.status = 404;
                throw err;
            }
            
            logApiDirect('getTicketById_mock_success', { 
                id, 
                status: one.status,
                category: one.category 
            }, 'api/tickets.ts');
            return one;
        }
        
        const ticket = await fetchJson<Ticket>(`/api/tickets/${encodeURIComponent(id)}`, { 
            signal, 
            metaname: 'getTicketById' 
        });
        
        logApiDirect('getTicketById_success', { 
            id, 
            status: ticket.status,
            category: ticket.category,
            hasAttachments: !!ticket.attachments?.length
        }, 'api/tickets.ts');
        
        return ticket;
    } catch (err) {
        logErrorDirect('getTicketById_error', err, { id, useMock: USE_MOCK });
        throw err;
    }
}

export async function getTicketsFiltered(params: Record<string, string>, signal?: AbortSignal): Promise<Ticket[]> {
    logApiDirect('getTicketsFiltered_start', { params }, 'api/tickets.ts');
    
    try {
        const query = new URLSearchParams(params).toString();
        const response = await fetchJson<{ items: Ticket[], page: any }>(`/api/tickets?${query}`, { 
            signal, 
            metaname: 'getTicketsFiltered' 
        });
        const tickets = response.items || [];
        
        logApiDirect('getTicketsFiltered_success', { 
            params,
            count: tickets.length 
        }, 'api/tickets.ts');
        
        return tickets;
    } catch (err) {
        logErrorDirect('getTicketsFiltered_error', err, { params });
        throw err;
    }
}

export type SimilarTicket = {
    incident_id: string;
    summary: string;
    description: string;
    category: string;
    subcategory: string;
    status: string;
    priority: string;
    created_date_time: string;
    similarity_score: number;
};

export type SimilarTicketsResponse = {
    incident_id: string;
    similar_tickets: SimilarTicket[];
    count: number;
};

export async function getSimilarTickets(id: string, limit: number = 5, signal?: AbortSignal): Promise<SimilarTicketsResponse> {
    logApiDirect('getSimilarTickets_start', { id, limit }, 'api/tickets.ts');
    
    try {
        const response = await fetchJson<SimilarTicketsResponse>(
            `/api/tickets/${encodeURIComponent(id)}/similar?limit=${limit}`, 
            { signal, metaname: 'getSimilarTickets' }
        );
        
        logApiDirect('getSimilarTickets_success', { 
            id, 
            count: response.similar_tickets?.length || 0 
        }, 'api/tickets.ts');
        
        return response;
    } catch (err) {
        logErrorDirect('getSimilarTickets_error', err, { id, limit });
        throw err;
    }
}