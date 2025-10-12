import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Table, { Column } from "../components/Table";
import { getAllTickets, Ticket } from "../api/tickets";
import { useCallback, useEffect, useMemo, useState } from "react";
import { fmtDate } from "../utils/formatting";
import { toCSV, downloadBlob } from "../utils/csv";
import { INTERNAL_STATUSES, internalStatus } from "../constants";
import { getInternalStatus } from "../store/internalStatus";
import { useLogger } from "../store/logger";

type Row = Ticket & { internal_status?: internalStatus | "" };

export default function TicketsAll() {
    const nav = useNavigate();
    const { logInfo, logDebug, logError, startTimer } = useLogger();
    const { data = [], isLoading } = useQuery({ queryKey: ["tickets", "all"], queryFn: ({ signal }) => getAllTickets(signal) });
    const [viewRows, setViewRows] = useState<Row[]>([]);
    const [ctx, setCtx] = useState<{ x: number; y: number; row: Row } | null>(null);

    // Log component lifecycle
    useEffect(() => {
        logInfo('TicketsAll_mounted', {}, 'pages/TicketsAll.tsx');
        return () => {
            logInfo('TicketsAll_unmounted', {}, 'pages/TicketsAll.tsx');
        };
    }, [logInfo]);

    // Log data loading state changes
    useEffect(() => {
        if (isLoading) {
            logDebug('TicketsAll_loading', {}, 'pages/TicketsAll.tsx');
        } else {
            logInfo('TicketsAll_data_loaded', { 
                ticketCount: data.length,
                uniqueCategories: new Set(data.map(t => t.category)).size,
                uniqueStatuses: new Set(data.map(t => t.status)).size
            }, 'pages/TicketsAll.tsx');
        }
    }, [isLoading, data.length, logDebug, logInfo, data]);

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

    // Memoize the callback to prevent infinite re-renders
    const handleViewRowsChange = useCallback((r: Row[]) => {
        setViewRows(r);
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

    const onDownloadCSV = useCallback(() => {
        const timer = startTimer('csv_download');
        logInfo('TicketsAll_csv_download_started', { 
            rowCount: viewRows.length,
            columnCount: columns.length 
        }, 'pages/TicketsAll.tsx');
        
        try {
            const headers = columns.map((c) => ({ key: c.key as keyof Row, header: c.header }));
            const csv = toCSV(viewRows, headers);
            const stamp = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16);
            const filename = `home-tickets-view-${stamp}.csv`;
            downloadBlob(csv, filename);
            
            const duration = timer.end();
            logInfo('TicketsAll_csv_download_success', { 
                filename,
                rowCount: viewRows.length,
                csvSize: csv.length,
                duration_ms: duration
            }, 'pages/TicketsAll.tsx');
        } catch (err) {
            logError('TicketsAll_csv_download_error', err, { rowCount: viewRows.length });
        }
    }, [viewRows, columns, startTimer, logInfo, logError]);

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
                    onRowClick={(r) => {
                        logInfo('TicketsAll_ticket_clicked', { 
                            ticketId: r.incident_id,
                            status: r.status,
                            category: r.category
                        }, 'pages/TicketsAll.tsx');
                        nav(`/tickets/${encodeURIComponent(r.incident_id)}`);
                    }}
                    onRowContextMenu={(row, pos) => {
                        logDebug('TicketsAll_context_menu_opened', { 
                            ticketId: row.incident_id,
                            x: pos.x,
                            y: pos.y
                        }, 'pages/TicketsAll.tsx');
                        setCtx({ x: pos.x, y: pos.y, row });
                    }}
                    onViewRowsChange={handleViewRowsChange}
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
                                logInfo('TicketsAll_open_in_new_tab', { 
                                    ticketId: ctx.row.incident_id 
                                }, 'pages/TicketsAll.tsx');
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
