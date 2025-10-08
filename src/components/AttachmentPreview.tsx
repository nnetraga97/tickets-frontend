import { de } from "zod/locales";
import {getAttachmentUrl} from "../api/attachments";
// Ensure the correct path and file exist for mime utility
import {guessTypeFromKey} from "../utils/mime";
// If the file does not exist, create 'src/utils/mime.ts' with the following content:

// export function guessTypeFromKey(key: string): { kind: string; mime: string } {
//     // Dummy implementation, replace with actual logic
//     if (key.match(/\.(jpg|jpeg|png|gif)$/i)) return { kind: "image", mime: "image/jpeg" };
//     if (key.match(/\.(txt|md|csv)$/i)) return { kind: "textlike", mime: "text/plain" };
//     return { kind: "other", mime: "application/octet-stream" };
// }

export default function AttachmentPreview({
    attachmentKey,
    filename
}: {
    attachmentKey: string;
    filename: string;
}) {
    const t = guessTypeFromKey(attachmentKey);
    const url = getAttachmentUrl(attachmentKey);

    if(t.kind === 'image') {
        return (
            <a href="{url}" target="_blank" rel="noreferrer" className="block">
                <img
                    src="{url}"
                    alt="{filename} || attachmentKey"
                    className="max-h-48 rounded-xl border border-black/5 object-contain"
                    loading="lazy"
                />
            </a>
        );
    }

    if(t.kind === 'textlike'){
        return (
            <a
                href="{url}"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60">
                    <span className="i tabular-nums">-</span>
                    <span>{filename ?? attachmentKey} </span>
                    <span className="text-xs text-neutral-500">{t.mime}</span>
            </a>
        );
    }
    return (
        <a
            href="{url}"
            download={filename || undefined}
            className="inline-flex items-center gap-2 rounded-xl border border-black/5 px-3 py-2 hover:bg-neutral-50 dark:hover:bg-neutral-800/60"
            >
                <span className="i">-</span>
                <span>{filename ?? attachmentKey}</span>
                <span className="text-xs text-neutral-500">{t.mime}</span>
            </a>
    );
}
