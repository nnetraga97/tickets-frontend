import { Ticket } from "../api/tickets";
import { fmtDate } from "../utils/formatting";

interface TicketInfoGridProps {
    ticket: Ticket;
}

export default function TicketInfoGrid({ ticket: t }: TicketInfoGridProps) {
    return (
        <section className="grid gap-4 md:grid-cols-2">
            <InfoItem label="Incident Type" value={t.incident_type} />
            <InfoItem label="Priority" value={t.priority} />
            <InfoItem label="Owned By" value={t.owned_by} />
            <InfoItem label="Category" value={t.category} />
            <InfoItem label="SubCategory" value={t.subcategory} />
            <InfoItem label="Service" value={t.service} />
            <InfoItem label="Created By" value={t.created_by} />
            <InfoItem label="Resolved By" value={t.resolved_by} />
            <InfoItem label="Customer" value={t.customer_name} />
            <InfoItem label="Created" value={fmtDate(t.created_date)} />
            <InfoItem label="Last Modified" value={fmtDate(t.last_modified_date)} />
            <InfoItem label="Closed" value={t.closed_date ? fmtDate(t.closed_date) : ""} />
        </section>
    );
}

function InfoItem({ label, value }: { label: string; value?: string | null }) {
    return (
        <div className="rounded-2xl border border-black/5 bg-white p-4 dark:bg-neutral-900">
            <div className="text-xs uppercase tracking-wide text-neutral-500">{label}</div>
            <div className="mt-1 text-sm">{value || "-"}</div>
        </div>
    );
}

