import { useState, useEffect } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { 
    getAttachmentsByIncidentId, 
    deleteAttachment,
    getUploadUrl,
    uploadFileToS3,
    createAttachment,
    markUploadComplete
} from "../api/attachments";
import { useAlert } from "../store/alert";
import { useLogger } from "../store/logger";
import AttachmentPreview from "./AttachmentPreview";
import TicketSection from "./TicketSection";

interface AttachmentsSectionProps {
    incidentId: string;
}

export default function AttachmentsSection({ incidentId }: AttachmentsSectionProps) {
    const qc = useQueryClient();
    const { push } = useAlert();
    const { logInfo, logDebug, logError, startTimer } = useLogger();
    const [attachmentsOpen, setAttachmentsOpen] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { data: attachmentsData, isLoading: attachmentsLoading, error: attachmentsError, refetch: refetchAttachments } = useQuery({
        queryKey: ["attachments", incidentId],
        queryFn: () => getAttachmentsByIncidentId(incidentId),
        enabled: !!incidentId,
        staleTime: 60000, // 60 seconds
    });

    useEffect(() => {
        if (attachmentsData) {
            logInfo('AttachmentsSection_attachments_loaded', { 
                ticketId: incidentId,
                count: attachmentsData.length,
                attachments: attachmentsData.map(a => ({ id: a.id, filename: a.filename }))
            }, 'components/AttachmentsSection.tsx');
        }
        if (attachmentsError) {
            logError('AttachmentsSection_attachments_error', attachmentsError, { ticketId: incidentId });
        }
    }, [attachmentsData, attachmentsError, incidentId, logInfo, logError]);

    const deleteAttachmentMutation = useMutation({
        mutationFn: (attachmentId: string) => deleteAttachment(attachmentId),
        onSuccess: () => {
            logInfo('AttachmentsSection_attachment_deleted', { ticketId: incidentId }, 'components/AttachmentsSection.tsx');
            qc.invalidateQueries({ queryKey: ["attachments", incidentId] });
            refetchAttachments();
            push({
                kind: "success",
                title: "Attachment deleted",
                message: "Attachment has been successfully deleted",
            });
        },
        onError: (error) => {
            logError('AttachmentsSection_attachment_delete_error', error, { ticketId: incidentId });
            push({
                kind: "error",
                title: "Failed to delete attachment",
                message: "Could not delete attachment. Please try again.",
            });
        }
    });

    const handleFileUpload = async (file: File) => {
        const timer = startTimer('upload_attachment');
        setUploading(true);

        try {
            logInfo('AttachmentsSection_upload_started', { 
                ticketId: incidentId,
                filename: file.name,
                size: file.size,
                type: file.type
            }, 'components/AttachmentsSection.tsx');

            const timestamp = Date.now();
            const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const storageKey = `attachments/${incidentId}/${timestamp}-${sanitizedFilename}`;
            
            const { url: uploadUrl } = await getUploadUrl(storageKey, file.type);
            logInfo('AttachmentsSection_presigned_url_obtained', { ticketId: incidentId, storageKey: uploadUrl }, 'components/AttachmentsSection.tsx');

            await uploadFileToS3(uploadUrl, file);
            logInfo('AttachmentsSection_s3_upload_complete', { ticketId: incidentId, storageKey }, 'components/AttachmentsSection.tsx');

            const attachmentRecord = await createAttachment({
                incident_id: incidentId,
                storage_key: storageKey,
                filename: file.name,
                content_type: file.type,
                file_size: file.size,
            });
            logInfo('AttachmentsSection_attachment_record_created', { 
                ticketId: incidentId, 
                attachmentId: attachmentRecord.id 
            }, 'components/AttachmentsSection.tsx');

            await markUploadComplete(attachmentRecord.id, file.size);
            logInfo('AttachmentsSection_upload_marked_complete', { 
                ticketId: incidentId,
                attachmentId: attachmentRecord.id
            }, 'components/AttachmentsSection.tsx');

            qc.invalidateQueries({ queryKey: ["attachments", incidentId] });
            refetchAttachments();

            const duration = timer.end();
            logInfo('AttachmentsSection_upload_success', { 
                ticketId: incidentId,
                filename: file.name,
                duration_ms: duration
            }, 'components/AttachmentsSection.tsx');

            push({
                kind: "success",
                title: "Upload successful",
                message: `${file.name} has been uploaded successfully`,
            });

        } catch (error) {
            const duration = timer.end();
            logError('AttachmentsSection_upload_failed', error, { 
                ticketId: incidentId,
                filename: file.name,
                duration_ms: duration
            });
            push({
                kind: "error",
                title: "Upload failed",
                message: `Failed to upload ${file.name}. Please try again.`,
            });
        } finally {
            setUploading(false);
        }
    };

    const triggerFileInput = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.multiple = false;
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (file) {
                handleFileUpload(file);
            }
        };
        input.click();
    };

    const headerAction = (
        <div className="flex items-center gap-2">
            <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="rounded-lg px-3 py-1.5 text-xs font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                {uploading ? 'Uploading...' : '+ Add Attachment'}
            </button>
            <button
                onClick={() => setAttachmentsOpen(!attachmentsOpen)}
                className="text-sm text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
            >
                {attachmentsOpen ? '▼ Collapse' : '▶ Expand'} ({attachmentsData?.length || 0})
            </button>
        </div>
    );

    return (
        <TicketSection title="Attachments" headerAction={headerAction}>
            {attachmentsOpen && (
                <>
                    {attachmentsLoading && <p className="text-sm text-neutral-500">Loading attachments...</p>}
                    {!attachmentsLoading && (!attachmentsData || attachmentsData.length === 0) && (
                        <p className="text-sm text-neutral-500">No Attachments</p>
                    )}
                    {!attachmentsLoading && attachmentsData && attachmentsData.length > 0 && (
                        <div className="space-y-2">
                            {attachmentsData.map((attachment) => (
                                <div 
                                    key={attachment.id} 
                                    className="flex items-center justify-between rounded-lg border border-black/5 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <AttachmentPreview 
                                            attachmentKey={attachment.storage_key} 
                                            filename={attachment.filename} 
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{attachment.filename}</p>
                                            <p className="text-xs text-neutral-500">
                                                {attachment.file_size ? `${(attachment.file_size / 1024).toFixed(2)} KB` : 'Size unknown'}
                                                {attachment.uploaded_by && ` • Uploaded by ${attachment.uploaded_by}`}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAttachmentMutation.mutate(attachment.id)}
                                        disabled={deleteAttachmentMutation.isPending}
                                        className="ml-2 rounded-lg px-2 py-1 text-xs text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                    >
                                        {deleteAttachmentMutation.isPending ? 'Deleting...' : 'Delete'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </>
            )}
        </TicketSection>
    );
}

