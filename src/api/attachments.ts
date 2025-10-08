import { fetchJson } from "./client";

const CDN = (import.meta as any).env.VITE_ATTACHMENT_CDN_BASE?.toString().trim() || '';

export function getAttachmentUrl(key: string): string {
    if(CDN) {
        return `${CDN.replace(/\/+$/,'')}/${key.replace(/^\/+/,'')}`;
    }
    return `/api/attachments/${encodeURIComponent(key)}?signed=true`;
}

export async function getSignedUrl(key: string, signal?: AbortSignal): Promise<string> {
    const resp = await fetchJson<{url: string}>(`/attachment/${encodeURIComponent(key)}`, { signal, metaname: 'getSignedUrl' });
    return resp.url;
}

