import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useLogger } from "../store/logger";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const location = useLocation() as any;
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const { logEvent } = useLogger();

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        logEvent("login_submit", { username: u, password: p })
        login({ username: u, token: "mock-token" });
        const dest = location.state?.from?.pathname || '/';
        nav(dest, { replace: true });
    };

    return (
        <div className="mx-auto mt-16 max-w-md rounded-3xl border border-black/5 bg-white p-8 shadow-soft-lg dark:bg-neutral-900">
            <h1 className="mb-6 text-center text-2xl font-semibold tracking-tight">Welcome</h1>
            <form onSubmit={submit} className="space-y-4">
                <div>
                    <label className="mb-1 block text-sm text-neutral-600 dark:text-neutral-300">Username</label>
                    <input
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none ring-0 focus:border-black/30 dark:bg-neutral-800"
                        value={u}
                        onChange={(e) => setU(e.target.value)}
                        data-action="login_username"
                        autoFocus
                    />
                </div>
                <div>
                    <label className="mb-1 block text-sm text-neutral-600 dark:text-neutral-300">Password</label>
                    <input
                        type="password"
                        className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 outline-none ring-0 focus:border-black/30 dark:bg-neutral-800"
                        value={p}
                        data-action="login_password"
                        onChange={(e) => setP(e.target.value)}
                    />
                </div>
                <button
                    type="submit"
                    data-action="login_submit"
                    className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white transition hover:opacity-90"
                >
                    Sign In
                </button>
            </form>
            <p className="mt-4 text-center text-xs text-neutral-500">
                This is a mock login. Any username and password will work.
            </p>
        </div>
    );
}
