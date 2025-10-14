import { fetchJson } from "./client";
import { logApiDirect, logErrorDirect } from "../store/logger";

const CDN = (import.meta as any).env.VITE_ATTACHMENT_CDN_BASE?.toString().trim() || '';

export type AttachmentDto = {
    id: string;
    ticket_id: string;
    incident_id: string;
    storage_key: string;
    filename: string;
    content_type: string;
    file_size: number | null;
    uploaded_by: string | null;
    upload_completed: boolean;
    description: string | null;
    created_at: string;
    updated_at: string;
    url?: string;
};

export type CreateAttachmentRequest = {
    incident_id: string;
    storage_key: string;
    filename: string;
    content_type: string;
    file_size?: number;
    description?: string;
};

export type UpdateAttachmentRequest = {
    filename?: string;
    description?: string;
    upload_completed?: boolean;
    file_size?: number;
};

export function getAttachmentUrl(key: string): string {
    const useCDN = !!CDN;
    logApiDirect('getAttachmentUrl', { key, useCDN }, 'api/attachments.ts');
    
    if(CDN) {
        return `${CDN.replace(/\/+$/,'')}/${key.replace(/^\/+/,'')}`;
    }
    return `/api/attachments/presigned/${encodeURIComponent(key)}`;
}

export async function getSignedUrl(key: string, signal?: AbortSignal): Promise<string> {
    logApiDirect('getSignedUrl_start', { key }, 'api/attachments.ts');
    
    try {
        const resp = await fetchJson<{url: string}>(
            `/api/attachments/presigned/${encodeURIComponent(key)}`, 
            { signal, metaname: 'getSignedUrl' }
        );
        logApiDirect('getSignedUrl_success', { key, hasUrl: !!resp.url }, 'api/attachments.ts');
        return resp.url;
    } catch (err) {
        logErrorDirect('getSignedUrl_error', err, { key });
        throw err;
    }
}

export async function getAttachmentsByIncidentId(incidentId: string, signal?: AbortSignal): Promise<AttachmentDto[]> {
    logApiDirect('getAttachmentsByIncidentId_start', { incidentId }, 'api/attachments.ts');
    
    try {
        const attachments = await fetchJson<AttachmentDto[]>(
            `/api/attachments/ticket/${encodeURIComponent(incidentId)}`,
            { signal, metaname: 'getAttachmentsByIncidentId' }
        );
        logApiDirect('getAttachmentsByIncidentId_success', { 
            incidentId, 
            count: attachments.length 
        }, 'api/attachments.ts');
        return attachments;
    } catch (err) {
        logErrorDirect('getAttachmentsByIncidentId_error', err, { incidentId });
        throw err;
    }
}

export async function createAttachment(request: CreateAttachmentRequest): Promise<AttachmentDto> {
    logApiDirect('createAttachment_start', { incidentId: request.incident_id }, 'api/attachments.ts');
    
    try {
        const attachment = await fetchJson<AttachmentDto>(
            '/api/attachments',
            { method: 'POST', body: request, metaname: 'createAttachment' }
        );
        logApiDirect('createAttachment_success', { 
            id: attachment.id, 
            incidentId: request.incident_id 
        }, 'api/attachments.ts');
        return attachment;
    } catch (err) {
        logErrorDirect('createAttachment_error', err, { request });
        throw err;
    }
}

export async function deleteAttachment(id: string): Promise<void> {
    logApiDirect('deleteAttachment_start', { id }, 'api/attachments.ts');
    
    try {
        await fetchJson<void>(
            `/api/attachments/${encodeURIComponent(id)}`,
            { method: 'DELETE', metaname: 'deleteAttachment' }
        );
        logApiDirect('deleteAttachment_success', { id }, 'api/attachments.ts');
    } catch (err) {
        logErrorDirect('deleteAttachment_error', err, { id });
        throw err;
    }
}

export async function markUploadComplete(id: string, fileSize?: number): Promise<AttachmentDto> {
    logApiDirect('markUploadComplete_start', { id, fileSize }, 'api/attachments.ts');
    
    try {
        const url = `/api/attachments/${encodeURIComponent(id)}/complete${fileSize ? `?fileSize=${fileSize}` : ''}`;
        const attachment = await fetchJson<AttachmentDto>(
            url,
            { method: 'PUT', metaname: 'markUploadComplete' }
        );
        logApiDirect('markUploadComplete_success', { id }, 'api/attachments.ts');
        return attachment;
    } catch (err) {
        logErrorDirect('markUploadComplete_error', err, { id });
        throw err;
    }
}

export async function getUploadUrl(key: string, contentType: string): Promise<{ url: string; method: string }> {
    logApiDirect('getUploadUrl_start', { key, contentType }, 'api/attachments.ts');
    
    try {
        const response = await fetchJson<{ url: string; method: string }>(
            '/api/attachments/upload-url',
            { 
                method: 'POST', 
                body: { key, content_type: contentType },
                metaname: 'getUploadUrl' 
            }
        );
        logApiDirect('getUploadUrl_success', { key }, 'api/attachments.ts');
        return response;
    } catch (err) {
        logErrorDirect('getUploadUrl_error', err, { key, contentType });
        throw err;
    }
}

export async function uploadFileToS3(presignedUrl: string, file: File): Promise<void> {
    logApiDirect('uploadFileToS3_start', { 
        filename: file.name,
        size: file.size,
        type: file.type ,
        url: presignedUrl,
    }, 'api/attachments.ts');
    
    try {
        const response = await fetch(presignedUrl, {
            method: 'PUT',
            body: file,
            headers: {
                'Content-Type': file.type,
            },
        });

        if (!response.ok) {
            throw new Error(`S3 upload failed: ${response.status} ${response.statusText}`);
        }

        logApiDirect('uploadFileToS3_success', { 
            filename: file.name,
            status: response.status 
        }, 'api/attachments.ts');
    } catch (err) {
        logErrorDirect('uploadFileToS3_error', err, { filename: file.name });
        throw err;
    }
}

