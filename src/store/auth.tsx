import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { logApiDirect } from "./logger";

type User = {
    username: string;
    token: string;
    email?: string;
    fullName?: string;
    role?: string;
} | null;

type AuthContextType = {
    user: User;
    isAuthenticated: boolean;
    login: (u: { username: string; token: string; email?: string; fullName?: string; role?: string }) => void;
    logout: () => void;
};

const Ctx = createContext<AuthContextType>(null as any);
const STORAGE_KEY = 'auth_session';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                logApiDirect('auth_restored_from_storage', { 
                    hasToken: true,
                    username: parsed.username,
                    role: parsed.role
                }, 'store/auth.tsx');
                return parsed;
            } catch (err) {
                logApiDirect('auth_restore_error', { error: String(err) }, 'store/auth.tsx');
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        logApiDirect('auth_no_stored_session', {}, 'store/auth.tsx');
        return null;
    });

    // Log auth state on mount
    useEffect(() => {
        logApiDirect('AuthProvider_mounted', { 
            isAuthenticated: !!user,
            username: user?.username
        }, 'store/auth.tsx');
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const login = useCallback((u: { username: string; token: string; email?: string; fullName?: string; role?: string }) => {
        logApiDirect('auth_login', { 
            username: u.username,
            role: u.role,
            tokenLength: u.token.length,
            timestamp: Date.now()
        }, 'store/auth.tsx');
        
        setUser(u);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
        } catch (err) {
            logApiDirect('auth_login_storage_error', { 
                error: String(err),
                username: u.username
            }, 'store/auth.tsx');
        }
    }, []);

    const logout = useCallback(() => {
        logApiDirect('auth_logout', { 
            username: user?.username,
            timestamp: Date.now()
        }, 'store/auth.tsx');
        
        setUser(null);
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (err) {
            logApiDirect('auth_logout_storage_error', { 
                error: String(err)
            }, 'store/auth.tsx');
        }
    }, [user]);

    const value = useMemo(() => ({
        user,
        isAuthenticated: !!user,
        login,
        logout
    }), [user, login, logout]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
    return useContext(Ctx);
}
