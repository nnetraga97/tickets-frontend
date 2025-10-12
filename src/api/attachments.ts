import { fetchJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

const CDN = (import.meta as any).env.VITE_ATTACHMENT_CDN_BASE?.toString().trim() || '';

export function getAttachmentUrl(key: string): string {
    const useCDN = !!CDN;
    logApiDirect('getAttachmentUrl', { key, useCDN }, 'api/attachments.ts');
    
    if(CDN) {
        return `${CDN.replace(/\/+$/,'')}/${key.replace(/^\/+/,'')}`;
    }
    return `/api/attachments/${encodeURIComponent(key)}?signed=true`;
}

export async function getSignedUrl(key: string, signal?: AbortSignal): Promise<string> {
    logApiDirect('getSignedUrl_start', { key }, 'api/attachments.ts');
    
    try {
        const resp = await fetchJson<{url: string}>(
            `/attachment/${encodeURIComponent(key)}`, 
            { signal, metaname: 'getSignedUrl' }
        );
        logApiDirect('getSignedUrl_success', { key, hasUrl: !!resp.url }, 'api/attachments.ts');
        return resp.url;
    } catch (err) {
        logErrorDirect('getSignedUrl_error', err, { key });
        throw err;
    }
}

