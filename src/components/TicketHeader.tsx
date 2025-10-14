import { useState } from "react";
import { internalStatus, INTERNAL_STATUSES } from "../constants";

interface TicketHeaderProps {
    incidentId: string;
    status: string;
    internalStatus: internalStatus | "";
    onInternalStatusChange: (status: internalStatus | "") => void;
    onScrape: () => void;
    onElig: (target: "edg" | "edbc") => void;
}

export default function TicketHeader({ 
    incidentId, 
    status, 
    internalStatus: internal, 
    onInternalStatusChange,
    onScrape,
    onElig
}: TicketHeaderProps) {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">
                Incident {incidentId.replace(/^INC-/, '')} <span className="ml-2 text-sm text-neutral-500">{status}</span>
            </h1>
            <h1 className="text-2xl font-semibold">
                <select 
                    value={internal} 
                    onChange={(e) => onInternalStatusChange((e.target.value || "") as internalStatus | "")}
                    className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none focus:border-black/30 dark:bg-neutral-800 overflow-auto">
                    <option value="">-</option>
                    {INTERNAL_STATUSES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
            </h1>
            <div className="relative">
                <button
                    onClick={() => setMenuOpen((v) => !v)}
                    data-action="ticket_options_toggle"
                    className="rounded-xl bg-black px-3 py-1.5 text-sm text-white transition hover:opacity-90 dark:bg-white dark:text-black">
                    Options 🔻
                </button>
                {menuOpen && (
                    <div
                        className="absolute right-0 z-10 mt-2 w-72 overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-soft-lg dark:border-white/10 dark:bg-neutral-900"
                        onMouseLeave={() => setMenuOpen(false)}
                    >
                        <MenuItem label="Scrape for Latest" onClick={onScrape} data-action="scrape_options_toggle" />
                        <MenuItem label="Search for similar" onClick={onScrape} data-action="simillar_options_toggle" />
                        <div className="my-1 border-t border-black/10 dark:border-white/10" />
                        <MenuItem label="View case in Support" onClick={onScrape} data-action="support_options_toggle" />
                        <MenuItem label="View case in Patch" onClick={onScrape} data-action="patch_options_toggle" />
                        <MenuItem label="View case in Prod" onClick={onScrape} data-action="prod_options_toggle" />
                        <div className="my-1 border-t border-black/10 dark:border-white/10" />
                        <SubHeader>Run case in Aspen Supp➡️</SubHeader>
                        <MenuItem label="Edg" onClick={() => onElig("edg")} data-action="edgrun_options_toggle" />
                        <MenuItem label="Edbc" onClick={() => onElig("edbc")} data-action="edbc_options_toggle" />
                        <div className="my-1 border-t border-black/10 dark:border-white/10" />
                        <MenuItem label="View Logs" disabled data-action="viewlogs_options_toggle" />
                        <MenuItem label="View Dbeaver" disabled data-action="opt_open_dbeaver" />
                    </div>
                )}
            </div>
        </header>
    );
}

function MenuItem({ label, onClick, disabled = false, dataAction }: { label: string; onClick?: () => void; disabled?: boolean; dataAction?: string }) {
    return (
        <button
            disabled={disabled}
            onClick={onClick}
            data-action={dataAction || `menuitem_${label.toLowerCase().trim().replace(/\s+/g, "_")}`}
            className={`w-full rounded-lg px-2 py-1.5 text-left text-sm ${disabled
                ? "opacity-50"
                : "hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
                }`}
        >
            {label}
        </button>
    );
}

function SubHeader({ children }: { children: React.ReactNode }) {
    return <div className="px-2 py-1 text-xs uppercase tracking-wide text-neutral-500">{children}</div>;
}

