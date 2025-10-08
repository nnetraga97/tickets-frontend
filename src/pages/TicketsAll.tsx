import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Table, { Column } from "../components/Table";
import { getAllTickets, Ticket } from "../api/tickets";
import { useEffect, useMemo, useState } from "react";
import { fmtDate } from "../utils/formatting";
import { toCSV, downloadBlob } from "../utils/csv";
import { INTERNAL_STATUSES, internalStatus } from "../constants";
import { getInternalStatus } from "../store/internalStatus";

type Row = Ticket & { internal_status?: internalStatus | "" };

export default function TicketsAll() {
    const nav = useNavigate();
    const { data = [], isLoading } = useQuery({ queryKey: ["tickets", "all"], queryFn: ({ signal }) => getAllTickets(signal) });
    const [viewRows, setViewRows] = useState<Row[]>([]);
    const [ctx, setCtx] = useState<{ x: number; y: number; row: Row } | null>(null);

    // augment with local internal status
    const rows: Row[] = useMemo(
        () =>
            data.map((t) => ({ ...t, internal_status: (getInternalStatus(t.incident_id) as any) || "" })),
        [data],
    );

    // refresh internal status when changed elsewhere
    useEffect(() => {
        const ref = () => setViewRows((r) => r.map((x) => ({ ...x, internal_status: (getInternalStatus(x.incident_id) as any) || "" })));
        const onEvt = () => ref();
        window.addEventListener("internal-status-changed", onEvt as any);
        return () => window.removeEventListener("internal-status-changed", onEvt as any);
    }, []);

    const columns: Column<Row>[] = [
        {
            key: "incident_id", header: "Ticket ID", sortable: true, filter: "text",
            render: (r) => <span className="font-mono">{r.incident_id}</span>
        },
        { key: "description", header: "Description", sortable: true, filter: "text" },
        {
            key: "created_date", header: "Create DT", sortable: true, filter: "text",
            accessor: (r) => new Date(r.created_date), render: (r) => fmtDate(r.created_date)
        },
        { key: "owned_by", header: "Owned By", sortable: true, filter: "select" },
        { key: "status", header: "Status", sortable: true, filter: "select" },
        { key: "category", header: "Category", sortable: true, filter: "select" },
        {
            key: "last_modified_date", header: "Last Modified", sortable: true, filter: "text",
            accessor: (r) => new Date(r.last_modified_date), render: (r) => fmtDate(r.last_modified_date)
        },
        // NEW: internal_status
        {
            key: "internal_status",
            header: "Internal Status",
            sortable: true,
            filter: "select",
            render: (r) => r.internal_status || "—",
        },
    ];

    const onDownloadCSV = () => {
        const headers = columns.map((c) => ({ key: c.key as keyof Row, header: c.header }));
        const csv = toCSV(viewRows, headers);
        const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
        downloadBlob(csv, `home-tickets-view-${stamp}.csv`);
    };

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">All Tickets</h1>
                <button
                    onClick={onDownloadCSV}
                    className="rounded-xl bg-black px-3 py-1.5 text-sm text-white transition hover:opacity-90 dark:bg-white dark:text-black"
                >
                    Download CSV
                </button>
            </div>

            <div className="relative">
                <Table<Row>
                    rows={rows}
                    columns={columns}
                    getRowId={(r) => r.incident_id}
                    onRowClick={(r) => nav(`/tickets/${encodeURIComponent(r.incident_id)}`)}
                    onRowContextMenu={(row, pos) => setCtx({ x: pos.x, y: pos.y, row })}
                    onViewRowsChange={(r) => setViewRows(r)}
                    enableFilters
                    enableSorting
                />
                {/* Context menu */}
                {ctx && (
                    <div
                        className="absolute z-40 rounded-lg border border-black/10 bg-white p-1 shadow-xl dark:bg-neutral-900"
                        style={{ left: ctx.x, top: ctx.y }}
                        onMouseLeave={() => setCtx(null)}
                    >
                        <button
                            className="block w-full rounded-md px-3 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                            onClick={() => {
                                window.open(`/tickets/${encodeURIComponent(ctx.row.incident_id)}`, "_blank", "noopener,noreferrer");
                                setCtx(null);
                            }}
                        >
                            Open in new tab
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
