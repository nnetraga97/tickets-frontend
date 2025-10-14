import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/auth";
import { useLogger } from "../store/logger";
import { login as apiLogin } from "../api/auth";

export default function Login() {
    const { login } = useAuth();
    const nav = useNavigate();
    const location = useLocation() as any;
    const [u, setU] = useState('');
    const [p, setP] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { logEvent, logInfo, logWarn, logError, startTimer } = useLogger();

    // Log component lifecycle
    useEffect(() => {
        logInfo('Login_page_mounted', { 
            redirectFrom: location.state?.from?.pathname 
        }, 'pages/Login.tsx');
        return () => {
            logInfo('Login_page_unmounted', {}, 'pages/Login.tsx');
        };
    }, [logInfo, location.state?.from?.pathname]);

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        const timer = startTimer('login');
        setError('');
        setLoading(true);
        
        // NEVER log passwords! Only log username for debugging
        logInfo('Login_submit_attempt', { 
            username: u,
            hasPassword: !!p,
            redirectTo: location.state?.from?.pathname || '/'
        }, 'pages/Login.tsx');
        
        if (!u || !p) {
            logWarn('Login_empty_credentials', { 
                hasUsername: !!u,
                hasPassword: !!p
            }, 'pages/Login.tsx');
            setError('Please enter username and password');
            setLoading(false);
            return;
        }
        
        try {
            logEvent("login_submit", { username: u })
            
            // Call real login API
            const response = await apiLogin({ username: u, password: p });
            
            // Store credentials in auth context
            login({ 
                username: response.username, 
                token: response.token,
                email: response.email,
                fullName: response.full_name,
                role: response.role
            });
            
            const dest = location.state?.from?.pathname || '/';
            const duration = timer.end();
            
            logInfo('Login_success', { 
                username: response.username,
                role: response.role,
                redirectTo: dest,
                duration_ms: duration
            }, 'pages/Login.tsx');
            
            nav(dest, { replace: true });
        } catch (err) {
            const duration = timer.end();
            const errorMsg = (err as any)?.message || 'Login failed';
            
            logError('Login_failed', err, { 
                username: u,
                duration_ms: duration
            });
            
            setError(errorMsg);
            setLoading(false);
        }
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
                    disabled={loading}
                    className="w-full rounded-xl bg-black px-4 py-2 font-medium text-white transition hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
                {error && (
                    <div className="text-sm text-red-600 dark:text-red-400 text-center">
                        {error}
                    </div>
                )}
            </form>
            <p className="mt-4 text-center text-xs text-neutral-500">
                Test users: test/p, nikhil/n, admin/admin
            </p>
        </div>
    );
}
