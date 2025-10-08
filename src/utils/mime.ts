export function guessTypeFromKey(key: string): {kind: 'image' | 'textlike' | 'other'; mime: string} {
    const lowerKey = key.toLowerCase();
    if(lowerKey.endsWith('.png') || lowerKey.endsWith('.jpg') || lowerKey.endsWith('.jpeg') || lowerKey.endsWith('.gif') || lowerKey.endsWith('.bmp') || lowerKey.endsWith('.webp') || lowerKey.endsWith('.svg')) {
        return {kind: 'image', mime: 'image/*'};
    }
    if(lowerKey.endsWith('.txt') || lowerKey.endsWith('.md') || lowerKey.endsWith('.json') || lowerKey.endsWith('.xml') || lowerKey.endsWith('.csv') || lowerKey.endsWith('.log') || lowerKey.endsWith('.html') || lowerKey.endsWith('.css') || lowerKey.endsWith('.js')) {
        return {kind: 'textlike', mime: 'text/plain'};
    }
    if(lowerKey.endsWith('.pdf')) {
        return {kind: 'other', mime: 'application/pdf'};
    }
    if(lowerKey.endsWith('.doc') || lowerKey.endsWith('.docx')) {
        return {kind: 'other', mime: 'application/msword'};
    }
    if(lowerKey.endsWith('.xls') || lowerKey.endsWith('.xlsx')) {
        return {kind: 'other', mime: 'application/vnd.ms-excel'};
    }
    if(lowerKey.endsWith('.ppt') || lowerKey.endsWith('.pptx')) {
        return {kind: 'other', mime: 'application/vnd.ms-powerpoint'};
    }
    if(lowerKey.endsWith('.zip') || lowerKey.endsWith('.rar') || lowerKey.endsWith('.7z') || lowerKey.endsWith('.tar') || lowerKey.endsWith('.gz')) {
        return {kind: 'other', mime: 'application/zip'};
    }
    if(lowerKey.endsWith('.mp3') || lowerKey.endsWith('.wav') || lowerKey.endsWith('.ogg')) {
        return {kind: 'other', mime: 'audio/*'};
    }
    if(lowerKey.endsWith('.mp4') || lowerKey.endsWith('.avi') || lowerKey.endsWith('.mov') || lowerKey.endsWith('.wmv') || lowerKey.endsWith('.flv') || lowerKey.endsWith('.mkv')) {
        return {kind: 'other', mime: 'video/*'};
    }
    if(lowerKey.endsWith('.csv')) {
        return {kind: 'textlike', mime: 'text/csv'};
    }
    return {kind: 'other', mime: 'application/octet-stream'};
}