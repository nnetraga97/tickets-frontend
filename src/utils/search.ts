import type { Ticket } from "../api/tickets";

export function ticketMatchesQuery(t: Ticket, q: string): boolean {
    if (!q) return true;

    const needle = q.toLowerCase().trim();
    if (!needle)
        return true;

    const bag: string[] = [];
    const add = (v?: string | null) => v && bag.push(v);

    add(t.incident_id);
    add(t.incident_type);
    add(t.status);
    add(t.description);
    add(t.subcategory);
    add(t.owned_by);
    add(t.summary);
    add(t.priority);
    add(t.created_by);
    add(t.category);
    add(t.service);
    add(t.customer_name);
    add(t.resolution);
    add(t.journal_notes);
    add(t.resolved_by);
    add(t.created_date);
    add(t.last_modified_date);
    add(t.closed_date || undefined);
    t.attachments?.forEach((a) => {
        add(a.key);
        add(a.filename);
    })

    const hay = bag.join(" | ").toLowerCase();
    return hay.includes(needle);
}

