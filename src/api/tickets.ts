import { fetchJson } from "./client";

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
    return fetchJson<Ticket[]>('/api/tickets', { signal, metaname: 'getAllTickets' });
}

export async function getTicketById(id: string, signal?: AbortSignal): Promise<Ticket> {
    if (USE_MOCK) {
        console.log("Mock used");
        const all = await fetchJson<Ticket[]>("/api/tickets", {
            signal,
            metaname: "getAllTicketsForId",
        });
        const one = all.find((t) => t.incident_id === id);
        console.log(one);
        if (!one) {
            const err: any = new Error("Not_found");
            err.status = 404;
            throw err;
        }
        return one;
    }
    return fetchJson<Ticket>(`/api/ticket/${encodeURIComponent(id)}`, { signal, metaname: 'getTicketById' });
}

export async function getTicketsFiltered(params: Record<string, string>, signal?: AbortSignal): Promise<Ticket[]> {
    const query = new URLSearchParams(params).toString();
    return fetchJson<Ticket[]>(`/api/tickets?${query}`, { signal, metaname: 'getTicketsFiltered' });
}