import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLogger } from "../store/logger";
import { tr } from "zod/locales";

export default function ActionTracker() {
    const { logEvent } = useLogger();
    const loc = useLocation();

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            const target = (e.target as HTMLElement)?.closest<HTMLElement>("[data-action],button,a,[role='button']");
            if (!target) return;
            const label =
                target.getAttribute("data-action") ||
                (target.textContent || "").trim().replace(/\s+/g, " ").slice(0, 80) ||
                target.getAttribute("aria-label") ||
                target.getAttribute("title") ||
                target.tagName;
            logEvent("ui_click", {
                path: loc.pathname,
                tag: target.tagName,
                id: target.id || undefined,
                role: target.getAttribute("role") || undefined,
                href: (target as HTMLAnchorElement).href || undefined,
                label,
            });

        };

        const onChange = (e: Event) => {
            const el = e.target as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
            if (!el || !("tagname" in el)) return;
            const tag = el.tagName;
            if (tag !== "INPUT" && tag !== "SELECT" && tag !== "TEXTAREA") return;
            const type = (el as HTMLInputElement).type || (tag as string).toLowerCase();

            logEvent("ui_change", {
                path: loc.pathname,
                tag,
                type,
                name: el.name || undefined,
                id: el.id || undefined,
                valueLen: (el as any).value ? String((el as any).value).length : 0,
            });
        };

        const onSubmit = (e: Event) => {
            const form = e.target as HTMLFormElement;
            if (!form || form.tagName !== "FORM") return;
            logEvent("ui_submit", {
                path: loc.pathname,
                id: form.id || undefined,
                name: form.getAttribute("name") || undefined,
            });
        };

        document.addEventListener("click", onClick, true);
        document.addEventListener("change", onChange, true);
        document.addEventListener("submit", onSubmit, true);
        return () => {
            document.removeEventListener("click", onClick, true);
            document.removeEventListener("change", onChange, true);
            document.removeEventListener("submit", onSubmit, true);
        };
    }, [logEvent, loc.pathname]);
    return null;
}