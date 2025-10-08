export function extractContexts(...texts: (string | undefined)[]): string[] {
    const set = new Set<string>();
    const rx = /\b\d{4,}\b/g;
    for (const t of texts) {
        if (!t)
            continue;
        const matches = t.match(rx);
        if (matches) {
            for (const m of matches) {
                set.add(m);
                if (set.size >= 20)
                    break;
            }
        }
        if (set.size >= 20) break;
    }
    return Array.from(set);
}