import { AnimatePresence, motion } from "framer-motion";
import { useAlert } from "../store/alert";

export default function AlertToasts() {
    const { items, remove } = useAlert();

    return (
        <div className="pointer-events-none fixed bottom-4 right-4 z-[1000] flex w-[min(92vw,380px)] flex-col gap-2">
            <AnimatePresence initial={false}>
                {items.map((a) => (
                    <motion.div
                        key={a.id}
                        initial={{ opacity: 0, y: 12, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                        transition={{ duration: 0.2 }}
                        className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-soft-lg ${kindClass(a.kind)
                            }`}
                    >
                        <div className="flex items-start gap-3">
                            <div className="mt-0.5 text-lg">{icon(a.kind)}</div>
                            <div className="min-w-0 flex-1">
                                {a.title && <div className="text-sm font-semibold">{a.title}</div>}
                                <div className="text-sm opacity-90">{a.message}</div>
                            </div>
                            <button
                                className="rounded-lg px-2 text-xs opacity-60 hover:opacity-100"
                                onClick={() => remove(a.id)}
                            >
                                x
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}

function kindClass(k?: string) {
    switch (k) {
        case "success":
            return "border-emerald-200 bg-emerald-50 dark:border-emerald-900/40 dark:bg-emerald-950/40";
        case "warning":
            return "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/40";
        case "error":
            return "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/40";
        default:
            return "border-neitral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900";
    }
}

function icon(k?: string) {
    switch (k) {
        case "success":
            return "✅";
        case "warning":
            return "⚠️";
        case "error":
            return "‼️";
        default:
            return "🔔";
    }
}