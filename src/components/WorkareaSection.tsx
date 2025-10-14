import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { getWorkarea, updateWorkarea, clearWorkarea } from "../api/workarea";
import { useAlert } from "../store/alert";
import { useLogger } from "../store/logger";
import { fmtDate } from "../utils/formatting";
import TicketSection from "./TicketSection";

interface WorkareaSectionProps {
    incidentId: string;
}

export default function WorkareaSection({ incidentId }: WorkareaSectionProps) {
    const qc = useQueryClient();
    const { push } = useAlert();
    const { logInfo, logDebug, logError } = useLogger();
    const [work, setWork] = useState<string>("");
    const [workareaSaveTimeout, setWorkareaSaveTimeout] = useState<NodeJS.Timeout | null>(null);

    const { data: workareaData, isLoading: workareaLoading } = useQuery({
        queryKey: ["workarea", incidentId],
        queryFn: () => getWorkarea(incidentId),
        enabled: !!incidentId,
        staleTime: 30000, // 30 seconds
    });

    useEffect(() => {
        if (workareaData) {
            setWork(workareaData.workarea || "");
            logDebug('WorkareaSection_workarea_loaded', {
                ticketId: incidentId,
                hasContent: !!workareaData.workarea,
                length: workareaData.workarea?.length || 0,
                lastModifiedBy: workareaData.last_modified_by
            }, 'components/WorkareaSection.tsx');
        }
    }, [workareaData, incidentId, logDebug]);

    const updateWorkareaMutation = useMutation({
        mutationFn: (workarea: string) => updateWorkarea({ incident_id: incidentId, workarea }),
        onSuccess: (response) => {
            logInfo('WorkareaSection_workarea_saved', {
                ticketId: incidentId,
                length: response.workarea?.length || 0,
                lastModifiedBy: response.last_modified_by
            }, 'components/WorkareaSection.tsx');
            qc.invalidateQueries({ queryKey: ["workarea", incidentId] });
        },
        onError: (error) => {
            logError('WorkareaSection_workarea_save_error', error, { ticketId: incidentId });
            push({
                kind: "error",
                title: "Failed to save workarea",
                message: "Could not save workarea changes. Please try again.",
            });
        }
    });

    const clearWorkareaMutation = useMutation({
        mutationFn: () => clearWorkarea(incidentId),
        onSuccess: () => {
            setWork("");
            logInfo('WorkareaSection_workarea_cleared', { ticketId: incidentId }, 'components/WorkareaSection.tsx');
            qc.invalidateQueries({ queryKey: ["workarea", incidentId] });
        },
        onError: (error) => {
            logError('WorkareaSection_workarea_clear_error', error, { ticketId: incidentId });
            push({
                kind: "error",
                title: "Failed to clear workarea",
                message: "Could not clear workarea. Please try again.",
            });
        }
    });

    const saveWork = (val: string) => {
        setWork(val);
        
        if (workareaSaveTimeout) {
            clearTimeout(workareaSaveTimeout);
        }

        const timeout = setTimeout(() => {
            updateWorkareaMutation.mutate(val);
        }, 1000);
        
        setWorkareaSaveTimeout(timeout);
    };

    const clearWork = () => {
        if (workareaSaveTimeout) {
            clearTimeout(workareaSaveTimeout);
        }
        clearWorkareaMutation.mutate();
    };

    const headerAction = (
        <>
            {updateWorkareaMutation.isPending && (
                <span className="text-xs text-blue-600 dark:text-blue-400">Saving...</span>
            )}
            {updateWorkareaMutation.isSuccess && !updateWorkareaMutation.isPending && (
                <span className="text-xs text-green-600 dark:text-green-400">Saved</span>
            )}
        </>
    );

    return (
        <TicketSection title="WorkArea" headerAction={headerAction}>
            <p className="mb-2 text-xs text-neutral-500">
                Notes are saved to the database and tracked by user (<span className="font-mono">{incidentId}</span>).
                {workareaData?.last_modified_by && (
                    <span className="ml-2">
                        Last modified by <span className="font-semibold">{workareaData.last_modified_by}</span>
                        {workareaData.last_modified_at && (
                            <span className="ml-1">at {fmtDate(workareaData.last_modified_at)}</span>
                        )}
                    </span>
                )}
            </p>
            <textarea
                value={work}
                onChange={(e) => saveWork(e.target.value)}
                disabled={workareaLoading}
                className="h-40 w-full resize-vertical rounded-xl border border-black/10 bg-white p-3 text-sm outline-none focus:border-black/30 disabled:opacity-50 dark:bg-neutral-800"
                placeholder={workareaLoading ? "Loading..." : "Write/paste anything..."}
            />
            <div className="mt-2 flex items-center justify-between text-xs text-neutral-500">
                <div className="flex items-center gap-3">
                    <span>{work.length} chars</span>
                    {workareaData?.history_count !== undefined && workareaData.history_count > 0 && (
                        <span className="text-neutral-400">
                            {workareaData.history_count} {workareaData.history_count === 1 ? 'change' : 'changes'}
                        </span>
                    )}
                </div>
                <button
                    onClick={clearWork}
                    disabled={clearWorkareaMutation.isPending || !work}
                    className="rounded-lg px-2 py-1 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed dark:hover:bg-neutral-800"
                >
                    {clearWorkareaMutation.isPending ? 'Clearing...' : 'Clear'}
                </button>
            </div>
        </TicketSection>
    );
}

