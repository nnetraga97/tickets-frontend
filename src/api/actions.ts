import { postJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

export type JobResponse = {
    job_id: string;
    status: string;
    message: string;
};

export async function scrapeTicket(id: string, signal?: AbortSignal): Promise<JobResponse> {
    logApiDirect('scrapeTicket_start', { id }, 'api/actions.ts');
    
    try {
        const result = await postJson<JobResponse>(
            "/api/ticket/scrape", 
            { id }, 
            { signal, metaname: "scrapeTicket" }
        );
        logApiDirect('scrapeTicket_queued', { id, jobId: result.job_id }, 'api/actions.ts');
        return result;
    } catch (err) {
        logErrorDirect('scrapeTicket_error', err, { id });
        throw err;
    }
}

export async function runElig(id: string, target: "edg" | "edbc", signal?: AbortSignal): Promise<JobResponse> {
    logApiDirect('runElig_start', { id, target }, 'api/actions.ts');
    
    try {
        const result = await postJson<JobResponse>(
            "/api/ticket/eligRun",
            { id, target },
            { signal, metaname: "eligRun" },
        );
        logApiDirect('runElig_queued', { id, target, jobId: result.job_id }, 'api/actions.ts');
        return result;
    } catch (err) {
        logErrorDirect('runElig_error', err, { id, target });
        throw err;
    }
}