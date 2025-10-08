import { createContext, useContext, useMemo, useState } from "react";

type SearchCtx = {
    q: string;
    setQ: (v: string) => void;
}

const Ctx = createContext<SearchCtx>(null as any);

export function SearchProvider({ children }: { children: React.ReactNode }) {
    const [q, setQ] = useState<string>("");
    const value = useMemo(() => ({ q, setQ }), [q]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useSearch() {
    return useContext(Ctx);
}