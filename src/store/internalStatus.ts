import { internalStatus } from "../constants";

const PREFIX = "internal_status";

export function getInternalStatus(id: string): internalStatus | undefined {
    try {
        const v = localStorage.getItem(PREFIX + id);
        return (v || undefined) as internalStatus | undefined;
    }
    catch {
        return undefined;
    }
}

export function setInternalStatus(id: string, value?: internalStatus) {
    try {
        if (!value)
            localStorage.removeItem(PREFIX + id);
        else
            localStorage.setItem(PREFIX + id, value);
        window.dispatchEvent(new CustomEvent("internal-status-changed", { detail: { id, value } }));
    } catch { }
}