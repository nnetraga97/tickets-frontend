export function fmtDate(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
    
    return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}:${milliseconds}`;
}

export function fmtDateOnly(dateString: string): string {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const year = date.getFullYear();
    
    return `${day}-${month}-${year}`;
}

export function isToday(dateString: string): boolean {
    const date = new Date(dateString);
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
}