import { fetchJson } from "./client";

export type WorkareaResponse = {
    incident_id: string;
    workarea: string | null;
    last_modified_by: string | null;
    last_modified_at: string | null;
    history_count: number;
};

export type WorkareaHistoryRecord = {
    id: string;
    ticket_id: string;
    incident_id: string;
    user_id: string;
    username: string;
    old_content: string | null;
    new_content: string | null;
    change_type: "created" | "updated" | "cleared";
    created_at: string;
    updated_at: string;
};

export type UpdateWorkareaRequest = {
    incident_id: string;
    workarea: string | null;
};

/**
 * Get workarea for a specific ticket
 */
export async function getWorkarea(incidentId: string): Promise<WorkareaResponse> {
    return fetchJson<WorkareaResponse>(`/api/workarea/${incidentId}`);
}

/**
 * Update workarea for a specific ticket
 */
export async function updateWorkarea(request: UpdateWorkareaRequest): Promise<WorkareaResponse> {
    return fetchJson<WorkareaResponse>('/api/workarea', {
        method: 'PUT',
        body: request, // fetchJson handles JSON.stringify
    });
}

/**
 * Clear workarea for a specific ticket
 */
export async function clearWorkarea(incidentId: string): Promise<WorkareaResponse> {
    return fetchJson<WorkareaResponse>(`/api/workarea/${incidentId}`, {
        method: 'DELETE',
    });
}

/**
 * Get workarea history for a specific ticket
 */
export async function getWorkareaHistory(incidentId: string): Promise<WorkareaHistoryRecord[]> {
    return fetchJson<WorkareaHistoryRecord[]>(`/api/workarea/${incidentId}/history`);
}

/**
 * Get workarea history for a specific ticket with pagination
 */
export async function getWorkareaHistoryPaged(
    incidentId: string,
    page: number = 0,
    size: number = 20
): Promise<{ content: WorkareaHistoryRecord[]; total_elements: number; total_pages: number }> {
    return fetchJson<{ content: WorkareaHistoryRecord[]; total_elements: number; total_pages: number }>(
        `/api/workarea/${incidentId}/history/paged?page=${page}&size=${size}`
    );
}

/**
 * Get all workarea changes made by the authenticated user
 */
export async function getUserWorkareaHistory(): Promise<WorkareaHistoryRecord[]> {
    return fetchJson<WorkareaHistoryRecord[]>('/api/workarea/user/history');
}

/**
 * Get all workarea changes made by the authenticated user with pagination
 */
export async function getUserWorkareaHistoryPaged(
    page: number = 0,
    size: number = 20
): Promise<{ content: WorkareaHistoryRecord[]; total_elements: number; total_pages: number }> {
    return fetchJson<{ content: WorkareaHistoryRecord[]; total_elements: number; total_pages: number }>(
        `/api/workarea/user/history/paged?page=${page}&size=${size}`
    );
}

