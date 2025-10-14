import { useNavigate } from "react-router-dom";

interface TicketNavigationProps {
    currentIndex: number;
    total: number;
    prevId?: string;
    nextId?: string;
}

export default function TicketNavigation({ currentIndex, total, prevId, nextId }: TicketNavigationProps) {
    const nav = useNavigate();

    return (
        <div className="flex items-center justify-between rounded-2xl border border-black/5 bg-white p-3 text-sm dark:bg-neutral-900">
            <div className="flex items-center gap-2">
                <span className="font-medium">Ticket</span>
                <span className="font-mono">{currentIndex >= 0 ? currentIndex + 1 : "?"}</span>of
                <span className="font-mono">{total || "0"}</span>
            </div>
            <div className="flex items center gap-2">
                <button
                    onClick={() => prevId && nav(`/tickets/${encodeURIComponent(prevId)}`)}
                    disabled={!prevId}
                    className="rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    <svg width="50%" height="10%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M20.6621 17C18.933 19.989 15.7013 22 11.9999 22C6.47703 22 1.99988 17.5228 1.99988 12C1.99988 6.47715 6.47703 2 11.9999 2C15.7013 2 18.933 4.01099 20.6621 7M11.9999 8L7.99995 12M7.99995 12L11.9999 16M7.99995 12H21.9999" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>Prev
                </button>
                <button
                    onClick={() => nextId && nav(`/tickets/${encodeURIComponent(nextId)}`)}
                    disabled={!nextId}
                    className="rounded-lg px-3 py-1.5 disabled:opacity-40 hover:bg-neutral-100 dark:hover:bg-neutral-800">
                    Next<svg width="50%" height="15%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3.33789 7C5.06694 4.01099 8.29866 2 12.0001 2C17.5229 2 22.0001 6.47715 22.0001 12C22.0001 17.5228 17.5229 22 12.0001 22C8.29866 22 5.06694 19.989 3.33789 17M12 16L16 12M16 12L12 8M16 12H2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

