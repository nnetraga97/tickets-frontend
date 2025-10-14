import { useState, useEffect } from "react";
import { loadCtxFields, saveCtxFields, addCtxItem, removeCtxItem, setCtxSelected } from "../store/contextFields";
import { extractContexts } from "../store/contextExtract";
import { useLogger } from "../store/logger";
import TicketSection from "./TicketSection";

interface ContextFieldsSectionProps {
    incidentId: string;
    summary?: string | null;
    description?: string | null;
}

export default function ContextFieldsSection({ incidentId, summary, description }: ContextFieldsSectionProps) {
    const { logInfo, logDebug } = useLogger();
    const [ctxList, setCtxList] = useState<string[]>([]);
    const [ctxSelected, setCtxSelectedState] = useState<string | undefined>(undefined);
    const [ctxInput, setCtxInput] = useState("");

    useEffect(() => {
        const stored = loadCtxFields(incidentId);
        const auto = extractContexts(summary, description);
        const merged = Array.from(new Set([...(stored.list || []), ...auto]));
        setCtxList(merged);
        setCtxSelectedState(stored.selected);
        if (!stored.selected && auto.length > 0 && !(auto[0] === "-")) {
            setCtxSelectedState(auto[0]);
        }
        saveCtxFields(incidentId, { list: merged, selected: stored.selected });

        const onChange = (e: Event) => {
            const det = (e as CustomEvent).detail as any;
            if (det?.id === incidentId) {
                const s = loadCtxFields(incidentId);
                setCtxList(s.list);
                setCtxSelectedState(s.selected);
            }
        };
        window.addEventListener("ctxf-changed", onChange as any);
        return () => window.removeEventListener("ctxf-changed", onChange as any);
    }, [incidentId, summary, description]);

    const onAddCtx = () => {
        const v = ctxInput.trim();
        if (!v) return;
        
        logInfo('ContextFields_context_added', { 
            ticketId: incidentId,
            contextValue: v
        }, 'components/ContextFieldsSection.tsx');
        
        addCtxItem(incidentId, v);
        setCtxInput("");
    };

    const onRemoveCtx = (v: string) => {
        logInfo('ContextFields_context_removed', { 
            ticketId: incidentId,
            contextValue: v
        }, 'components/ContextFieldsSection.tsx');
        
        removeCtxItem(incidentId, v);
    };

    const onSelectCtx = (v?: string) => {
        logDebug('ContextFields_context_selected', { 
            ticketId: incidentId,
            contextValue: v
        }, 'components/ContextFieldsSection.tsx');
        
        setCtxSelectedState(v || undefined);
        setCtxSelected(incidentId, v || undefined);
    };

    return (
        <TicketSection title="Context Fields">
            <div className="mb-3 flex items-center gap-2">
                <label className="text-sm opacity-70">Selected</label>
                <select
                    value={ctxSelected || ""}
                    onChange={(e) => onSelectCtx(e.target.value || undefined)}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800"
                >
                    <option value="">-</option>
                    {ctxList.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                {ctxSelected && <span className="text-xs text-neutral-500">Saved for {incidentId}</span>}
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
                {ctxList.length === 0 && <span className="text-sm text-neutral-500">No contexts</span>}
                {ctxList.map((c) => (
                    <span key={c} className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs ${c === ctxSelected ? "border-black bg-black text-white dark:bg-white dark:text-black" : "border-black/10 bg-neutral-50 dark:neutral-800"}`}>
                        <span className="font-mono">{c}</span>
                        <button
                            title="Remove"
                            onClick={() => onRemoveCtx(c)}
                            className="rounded-full px-1 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                        >
                            x
                        </button>
                    </span>
                ))}
            </div>

            <div className="flex items-center gap-2">
                <input 
                    value={ctxInput}
                    onChange={(e) => setCtxInput(e.target.value)}
                    placeholder="Add context"
                    className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800"
                />
                <button
                    onClick={onAddCtx}
                    className="rounded-xl bg-black px-3 py-2 text-sm text-white hover:opdacity-90 dark:bg-white dark:text-black"
                >
                    Add
                </button>
            </div>
        </TicketSection>
    );
}

