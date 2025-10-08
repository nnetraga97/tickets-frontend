import { postJson } from "./client";

export async function scrapeTicket(id: string, signal?: AbortSignal) {
    return postJson<{ status: string; id: string }>("/api/ticket/scrape", { id }, { signal, metaname: "scrapeTicket" });
}

export async function runElig(id: string, target: "edg" | "edbc", signal?: AbortSignal) {
    return postJson<{ status: string; id: string; target: string }>(
        "/api/ticket/eligRun",
        { id, target },
        { signal, metaname: "eligRun" },
    );
}