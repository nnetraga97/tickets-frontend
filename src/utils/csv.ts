export function toCSV<T extends Record<string, any>>(rows: T[], headers: { key: keyof T; header: string }[]) {
    const esc = (v: any) => {
        if (v === null || v === undefined)
            return "";
        const s = String(v);
        return /[]",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    const head = headers.map((h) => esc(h.header)).join(",");
    const body = rows.map((r) => headers.map((h) => esc(r[h.key])).join(",")).join("\n");
    return `${head}\n${body}`
}

export function downloadBlob(content: BlobPart, filename: string, mime = "text/csv;charset=utf-8") {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}