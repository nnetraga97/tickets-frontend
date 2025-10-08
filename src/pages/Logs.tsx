import { useEffect, useMemo, useState } from "react";
import { readLogs, readErrors, clearAllLogs } from "../store/logger";

type Row = { ts: number; type: string; data?: any; traceId?: string; message?: string; stack?: string; _kind: "log" | "error" };
export default function Logs() {
    const [logs, setLogs] = useState<Row[]>([]);
    const reload = () => {
        const L = readLogs().map((x) => ({ ...x, _kind: "log" as const }));
        const E = readErrors().map((x) => ({ ...x, _kind: "error" as const }));

        const all = [...L, ...E].sort((a, b) => b.ts - a.ts);
        setLogs(all);
    }

    useEffect(() => {
        reload();
        const onStorage = (e: StorageEvent) => {
            if (!e.key || e.key.includes("fw_")) reload();
        };
        window.addEventListener("storage", onStorage);
        return () => window.removeEventListener("storage", onStorage);
    }, []);

    const ndjson = useMemo(() => logs.map((r) => JSON.stringify(r)).join("\n"), [logs]);

    const openInNewTab = () => {
        const blob = new Blob([ndjson], { type: "application/x-ndjson" });
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank", "noopener,noreferrer");
    };

    const download = () => {
        const blob = new Blob([ndjson], { type: "application/x-ndjson" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const ts = new Date().toISOString().replace(/[-:]/g, "").slice(0, 15);
        a.href = url;
        a.download = `tickets-logs-${ts}.ndjson`;
        a.click();
        URL.revokeObjectURL(url);
    }

    const wipe = () => {
        clearAllLogs();
        reload();
    }

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Application Log Viewer</h1>
                <div className="flex items-center gap-2">
                    <button onClick={reload} className="rounded-lg ng-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">Refresh</button>
                    <button onClick={openInNewTab} className="rounded-lg ng-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">Open</button>
                    <button onClick={download} className="rounded-lg ng-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">Download</button>
                    <button onClick={wipe} className="rounded-lg ng-neutral-100 px-3 py-1.5 text-sm hover:bg-neutral-200 dark:bg-neutral-800 dark:hover:bg-neutral-700">Clear</button>
                </div>
            </header>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:bg-neutral-900">
                <div className="max-h-[70vh] overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800">
                            <tr>
                                <th className="px-3 py-2 text-left">Time</th>
                                <th className="px-3 py-2 text-left">Kind</th>
                                <th className="px-3 py-2 text-left">Type</th>
                                <th className="px-3 py-2 text-left">Trace</th>
                                <th className="px-3 py-2 text-left">Data / Message</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((r, i) => (
                                <tr key={i} className="border-b border-black/5 last:border-0">
                                    <td className="px-3 py-2 align-top whitespace-nowrap">{new Date(r.ts).toLocaleString()}</td>
                                    <td className="px-3 py-2 align-top">{r._kind}</td>
                                    <td className="px-3 py-2 align-top">{r.type}</td>
                                    <td className="px-3 py-2 align-top text-xs text-neutral-800">{r.traceId || "-"}</td>
                                    <td className="px-3 py-2 align-top">
                                        <pre className="whitespace-pre-wrap break-words text-xs">
                                            {r._kind === "error" ? (r.message || "Error") : JSON.stringify(r.data, null, 2)}
                                        </pre>
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500"> No Logs Yet.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

