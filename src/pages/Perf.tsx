import { useEffect, useState } from "react";
import { usePerf } from "../store/perf";

type Rec = { ts: number; type: string; name?: string; dur?: string; data?: any };

export default function Perf() {
    const [rows, SetRows] = useState<Rec[]>([]);
    const { downloadNDJSON, clear } = usePerf();

    useEffect(() => {
        try {
            const arr: Rec[] = JSON.parse(localStorage.getItem("perf_records_v1") || "[]");
            SetRows(arr.sort((a, b) => b.ts - a.ts));
        } catch { SetRows([]); }
        const onStorage = (e: StorageEvent) => {
            if (e.key === "perf_records_v1") {
                try {
                    SetRows(JSON.parse(e.newValue || "[]").sort((a: Rec, b: Rec) => b.ts - a.ts));
                } catch { }
            }
        };
        window.addEventListener("storage", onStorage);
        return () => {
            window.removeEventListener("storage", onStorage);
        }
    }, [])

    return (
        <div className="space-y-4">
            <header className="flex items-center justify-between">
                <h1 className="text-x1 font-semibold">Performace Metrics</h1>
                <div className="flex items-center gap-2">
                    <button onClick={downloadNDJSON} className="rounded-xl bg-black px-3 py-1.5 text-sm text-white hover:opacity-90 dark:bg-white dark:text-black">Download</button>
                    <button onClick={() => { clear(); SetRows([]); }} className="rounded-xl bg-red-600 px-3 py-1.5 text-sm text-white hover:opacity-90">Clear</button>
                </div>
            </header>

            <div className="overflow-hidden rounded-2xl border border-black/5 bg-white dark:bg-neutral-900">
                <div className="max-h-[70vh] overflow-auto">
                    <table className="min-w-full text-sm">
                        <thead className="bg-neutral-50/80 dark:bg-neutral-800">
                            <tr>
                                <th className="px-3 py-2 text-left">Time</th>
                                <th className="px-3 py-2 text-left">Type</th>
                                <th className="px-3 py-2 text-left">Name</th>
                                <th className="px-3 py-2 text-left">Duration (ms)</th>
                                <th className="px-3 py-2 text-left">Data</th>
                            </tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => (
                                <tr className="border-b border-black/5 last:border-0" key={i}>
                                    <td className="px-3 py-2 align-top whitespace-nowrap">{new Date(r.ts).toLocaleString()}</td>
                                    <td className="px-3 py-2 align-top">{r.type}</td>
                                    <td className="px-3 py-2 align-top">{r.name}</td>
                                    <td className="px-3 py-2 align-top">{typeof r.dur === "number" ? Math.round(r.dur) : "-"}</td>
                                    <td className="px-3 py-2 align-top">
                                        <pre className="whitespace-pre-wrap break-words text-xs">{r.data ? JSON.stringify(r.data, null, 2) : "-"}</pre>
                                    </td>
                                </tr>
                            ))}
                            {rows.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-3 py-6 text-center text-neutral-500">No performace entries yet...</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}