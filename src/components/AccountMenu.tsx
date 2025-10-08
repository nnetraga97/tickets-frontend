import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../store/auth";

export default function AccountMenu() {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement | null>(null);
    const nav = useNavigate();
    const { logout } = useAuth();

    useEffect(() => {
        const onDoc = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onDoc);
        return () => document.removeEventListener("mousedown", onDoc);
    }, []);

    return (
        <div ref={ref} className="relative">
            <button
                onClick={() => setOpen((v) => !v)}
                data-action="account-toggle"
                className="ml-2 rounded-full p-1.5 transition hover:bg-black/10 dark:hover:bg-white/10"
                title="Account"
            >
                <AvatarIcon />
            </button>
            {open && (
                <div className="absolute right-0 mt-2 w-[220px] overflow-hidden rounded-2xl border border-black/10 bg-white p-2 shadow-soft-lg dark:border-white/10 dark:bg-neutral-900">
                    <Item onClick={() => { nav("/account"); setOpen(false); }} label="Account" />
                    <Item onClick={() => { nav("/settings"); setOpen(false); }} label="Settings" />
                    <div className="my-1 border-t border-black/10 dark:border-white/10" />
                    <Item onClick={() => { logout(); setOpen(false); }} label="Logout" />
                </div>
            )}
        </div>
    );
}

function Item({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            data-action={`account_${label.toLowerCase()}`}
            className="w-full rounded-lg px-2 py-1.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700/50"
        >
            {label}
        </button>
    );
}

function AvatarIcon() {
    return (
        <svg width="22" height="22" viewBox="0 0 24 24" className="inline-block align-middle">
            <path fill="currentColor" d="M12 12a5 5 0 1 0-5-5 5 5 0 0 0 5 5Zm0 2c-4.418 0-8 2.239-8 5v1h16v-1c0-2.761-3.582-5-8-5z" />
        </svg>
    )
}