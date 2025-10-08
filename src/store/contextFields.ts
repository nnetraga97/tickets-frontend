const KEY = (id: string) => `ctxf:${id}`;

export type CtxFields = { list: string[]; selected?: string };

export function loadCtxFields(id: string): CtxFields {
    try {
        const raw = localStorage.getItem(KEY(id));
        if (raw)
            return JSON.parse(raw) as CtxFields;
    } catch {
    }
    return { list: [], selected: undefined };
}

export function saveCtxFields(id: string, data: CtxFields) {
    try {
        localStorage.setItem(KEY(id), JSON.stringify({ list: [...new Set(data.list)].slice(0, 50), selected: data.selected }));
        window.dispatchEvent(new CustomEvent("ctxf-changed", { detail: { id } }));
    }
    catch { }
}

export function addCtxItem(id: string, value: string) {
    const d = loadCtxFields(id);
    if (!value.trim())
        return;
    d.list = Array.from(new Set([value.trim(), ...d.list])).slice(0, 50);
    saveCtxFields(id, d);
}

export function removeCtxItem(id: string, value: string) {
    const d = loadCtxFields(id);
    d.list = d.list.filter((x) => x !== value);
    if (d.selected === value)
        d.selected = undefined;
    saveCtxFields(id, d);
}

export function setCtxSelected(id: string, selected?: string) {
    const d = loadCtxFields(id);
    d.selected = selected || undefined;
    saveCtxFields(id, d);

}