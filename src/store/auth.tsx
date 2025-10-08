import { createContext, useCallback, useContext, useMemo, useState } from "react";

type User = {
    username: string;
    token: string
} | null;

type AuthContextType = {
    user: User;
    isAuthenticated: boolean;
    login: (u: { username: string; token: string }) => void;
    logout: () => void;
};

const Ctx = createContext<AuthContextType>(null as any);
const STORAGE_KEY = 'auth_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User>(() => {
        const token = localStorage.getItem(STORAGE_KEY);
        if (token) {
            return { username: 'mock-user', token }; // In real app, decode token to get user info
        }
        return null;
    });

    const login = useCallback((u: { username: string; token: string }) => {
        setUser(u);
        localStorage.setItem(STORAGE_KEY, u.token);
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    }, []);

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
