
import { useEffect, useMemo, useState } from "react";
import { useLogger } from "../store/logger";

export type Column<T> = {
    key: keyof T; header: string; width?: string; render?: (item: T) => React.ReactNode;
    accessor?: (row: T) => string | number | Date | null | undefined;
    sortable?: boolean;

    filter?: "text" | "select" | ((row: T, q: string) => boolean);
};

type SortDir = "asc" | "desc";
type SortState<T> = { key: keyof T; dir: SortDir } | null;

export default function Table<T extends Record<string, any>>({
    rows,
    columns,
    getRowId,
    onRowClick,
    onRowContextMenu,
    onViewRowsChange,
    enableSorting = true,
    enableFilters = true,
    initialSort = null,
}: {
    rows: T[];
    columns: Column<T>[];
    getRowId: (row: T) => string;
    onRowClick?: (row: T) => void;
    onRowContextMenu?: (row: T, pos: { x: number, y: number }) => void;
    onViewRowsChange?: (rows: T[]) => void;
    enableSorting?: boolean;
    enableFilters?: boolean;
    initialSort?: SortState<T>;
}) {
    const [sort, setSort] = useState<SortState<T>>(initialSort);
    const [filters, setFilters] = useState<Record<string, string>>({});
    const { logEvent, logInfo, logDebug, startTimer } = useLogger();

    // Log table initialization
    useEffect(() => {
        logInfo('Table_mounted', { 
            rowCount: rows.length,
            columnCount: columns.length,
            enableSorting,
            enableFilters,
            hasInitialSort: !!initialSort
        }, 'components/Table.tsx');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // Log when data changes significantly
    useEffect(() => {
        logDebug('Table_rows_changed', { 
            rowCount: rows.length
        }, 'components/Table.tsx');
    }, [rows.length, logDebug]);
    const setFilter = (key: string, value: string) =>
        setFilters((f) => {
            const v = value ?? "";
            const next = { ...f, [key]: v };
            if (!v) delete next[key];
            
            logInfo("Table_filter_applied", { 
                key, 
                value: v,
                activeFilterCount: Object.keys(next).length
            }, 'components/Table.tsx');
            
            logEvent("table_filter", { key, value: v });
            return next;
        });

    const getVal = (col: Column<T>, row: T) => {
        const v = col.accessor ? col.accessor(row) : (row[col.key] as any);
        return v;
    }
    const filtered = useMemo(() => {
        const timer = startTimer('table_filter');
        
        if (!enableFilters || Object.keys(filters).length === 0) {
            return rows;
        }

        const result = rows.filter((r) =>
            columns.every((c) => {
                const k = String(c.key);
                const q = filters[k];
                if (!q) return true;

                if (typeof c.filter === "function") {
                    return c.filter(r, q);
                }

                const raw = getVal(c, r);
                if (c.filter === "select") {
                    return (String(raw ?? "") || "") === q;
                }

                const hay = (String(raw ?? "") || "").toLowerCase();
                return hay.includes(q.toLowerCase());
            }),
        );
        
        const duration = timer.end();
        logDebug('Table_filter_computed', { 
            inputRows: rows.length,
            outputRows: result.length,
            filterCount: Object.keys(filters).length,
            duration_ms: duration
        }, 'components/Table.tsx');
        
        return result;
    }, [rows, columns, filters, enableFilters, startTimer, logDebug]);

    const sorted = useMemo(() => {
        const timer = startTimer('table_sort');
        
        if (!enableSorting || !sort) {
            return filtered;
        }

        const col = columns.find((c) => String(c.key) === String(sort.key));
        if (!col || col.sortable === false) {
            return filtered;
        }

        const dir = sort.dir === "asc" ? 1 : -1;
        const result = [...filtered]
            .map((v, i) => ({ v, i }))
            .sort((a, b) => {
                const va = getVal(col, a.v);
                const vb = getVal(col, b.v);

                const norm = (x: any) => {
                    if (x instanceof Date) return x.getTime();
                    if (typeof x === "number") return x;
                    if (x === null || x === undefined) return "";
                    return String(x).toLowerCase();
                }

                const na = norm(va);
                const nb = norm(vb);

                if (na < nb) return -1 * dir;
                if (na > nb) return 1 * dir;
                return a.i - b.i;
            })
            .map((x) => x.v);
        
        const duration = timer.end();
        logDebug('Table_sort_computed', { 
            rowCount: filtered.length,
            sortKey: String(sort.key),
            sortDir: sort.dir,
            duration_ms: duration
        }, 'components/Table.tsx');
        
        return result;
    }, [filtered, columns, sort, enableSorting, startTimer, logDebug]);

    useEffect(() => {
        onViewRowsChange?.(sorted);
    }, [sorted, onViewRowsChange]);

    const toggleSort = (key: keyof T) => {
        if (!enableSorting) return;
        setSort((s) => {
            const next = !s || s.key !== key ? { key, dir: "asc" as SortDir } : s.dir === "asc" ? { key, dir: "desc" as SortDir } : null;
            const payload = next ? { key: String(key), dir: next.dir } : { key: String(key), dir: "off" };
            
            logInfo("Table_sort_toggled", { 
                sortKey: String(key),
                newDir: next?.dir || 'off',
                previousDir: s?.key === key ? s.dir : 'none'
            }, 'components/Table.tsx');
            
            logEvent("table_sort", { payload });
            return next;
        });
    };

    const clearFilters = () => {
        logInfo("Table_filters_cleared", { 
            previousFilterCount: Object.keys(filters).length
        }, 'components/Table.tsx');
        setFilters({});
    };
    
    const clearSort = () => {
        logInfo("Table_sort_cleared", { 
            previousSort: sort ? `${String(sort.key)} ${sort.dir}` : 'none'
        }, 'components/Table.tsx');
        setSort(null);
    };

    const handleClick = (row: T) => {
        onRowClick?.(row);
    };

    return (
        <div className="overflow-hidden rounded-2x1 border border-black/5 bg-white shadow-soft-lg dark:bg-neutral-900">
            {/*TOOLBAR*/}
            {(enableFilters || enableSorting) && (
                <div className="flex items-center justify-between gap-2 border-b border-black/5 p-2 text-xs text-neutral-600 dark:text-neutral-300">
                    <div className="flex items-center gap-2">
                        {enableFilters && Object.keys(filters).length > 0 && (
                            <button
                                onClick={clearFilters}
                                className="rounded-lg bg-natural-100 px-2 py-1 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                title="Clear filters"
                            >Clear Filters
                            </button>
                        )}
                        {enableSorting && sort && (
                            <button
                                onClick={clearSort}
                                className="rounded-lg bg-natural-100 px-2 py-1 hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700"
                                title="Clear sort"
                            >Clear Sort</button>
                        )}
                    </div>
                    <div className="opacity-70">
                        {enableSorting && sort ? (
                            <>Sorted By <span className="font-medium">{String(sort.key)}</span>({sort.dir})</>
                        ) : (
                            <></>
                        )}
                    </div>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-neutral-50/80 dark:bg-neutral-800">
                        <tr>
                            {columns.map((col) => {
                                const active = !!sort && sort.key === col.key;
                                const canSort = enableSorting && col.sortable !== false;
                                const k = String(col.key);
                                return (
                                    <th
                                        key={String(col.key)}
                                        className="px-4 py-3 text-left font-medium text-neutral-600 dark:text-neutral-300"
                                        style={{ width: col.width }}
                                    ><button
                                        type="button"
                                        className={`group inline-flex items-center gap-1 ${canSort ? "cursor-pointer select-none" : "cursor-default"}`}
                                        onClick={() => canSort && toggleSort(col.key)}
                                        title={canSort ? "Click to sort" : undefined}
                                    >
                                            {col.header}
                                            {canSort && (
                                                <span className="text-neutral-400 transition group-hover:text-neutral-700 dark:group-hover:text-neutral-200">
                                                    {active ? (sort!.dir === "asc" ? "↑" : "↓") : "↕"}
                                                </span>
                                            )}
                                        </button>
                                    </th>
                                );
                            })}
                        </tr>
                        {/*Filter row */}
                        {enableFilters && (
                            <tr>
                                {columns.map((col) => {
                                    const k = String(col.key);
                                    if (!col.filter)
                                        return <th key={`${k}-f`} className="px-4 pb-3" />;
                                    if (col.filter === "select") {
                                        const opts = Array.from(
                                            new Set(
                                                rows.map((r) => getVal(col, r))
                                                    .filter((x) => x != null && x !== undefined)
                                                    .map((x) => String(x)),
                                            ),
                                        ).sort((a, b) => a.localeCompare(b));
                                        return (
                                            <th key={`${k}-f`} className="px-4 pb-3">
                                                <select
                                                    className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-xs dark:bg-neutral-800"
                                                    value={filters[k] ?? ""}
                                                    onChange={(e) => setFilter(k, e.target.value)}
                                                >
                                                    <option value="">All</option>
                                                    {opts.map((o) => (
                                                        <option key={o} value={o}>
                                                            {o}
                                                        </option>
                                                    ))}
                                                </select>
                                            </th>
                                        );
                                    }
                                    return (
                                        <th key={`${k}-f`} className="px-4 pb-3">
                                            <input
                                                value={filters[k] ?? ""}
                                                onChange={(e) => setFilter(k, e.target.value)}
                                                placeholder="Filter.."
                                                className="w-full rounded-lg border border-black/10 bg-white px-2 py-1 text-xs outline-none focus:border-black/30 dark:bg-neutral-800"
                                            />
                                        </th>
                                    );
                                })
                                }
                            </tr>
                        )}
                    </thead>
                    <tbody>
                        {sorted.map((row) => {
                            const id = getRowId(row);
                            return (
                                <tr
                                    key={id}
                                    onClick={() => handleClick(row)}
                                    className="cursor-pointer transition hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
                                >
                                    {columns.map((col) => (
                                        <td key={String(col.key)} className="px-4 py-3 align-top">
                                            {col.render ? col.render(row) : String(row[col.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            );
                        })}
                        {sorted.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-4 py-10 text-center text-neutral-800">

                                    No data available.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
