/**
 * TraceInfo Component
 * 
 * Displays current trace and span information for debugging purposes.
 * Only shows in development mode.
 */

import { useTrace } from '../store/trace';
import { useState } from 'react';

export function TraceInfo() {
    const { traceId, spanId, getCurrentTraceId, getCurrentSpanId } = useTrace();
    const [isExpanded, setIsExpanded] = useState(false);

    // Only show in development
    if (import.meta.env.PROD) {
        return null;
    }

    const currentTraceId = getCurrentTraceId();
    const currentSpanId = getCurrentSpanId();

    return (
        <div className="fixed bottom-4 right-4 bg-gray-900 text-white p-3 rounded-lg shadow-lg text-xs font-mono z-50">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
            >
                <span>🔍 Trace Info</span>
                <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
            </button>
            
            {isExpanded && (
                <div className="mt-2 space-y-1">
                    <div>
                        <span className="text-gray-400">Trace ID:</span>
                        <div className="text-green-400 break-all">{currentTraceId || traceId}</div>
                    </div>
                    <div>
                        <span className="text-gray-400">Span ID:</span>
                        <div className="text-yellow-400 break-all">{currentSpanId || spanId || 'N/A'}</div>
                    </div>
                    <div className="text-gray-500 text-xs">
                        Open <a href="http://localhost:9411" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">Zipkin UI</a> to view traces
                    </div>
                </div>
            )}
        </div>
    );
}
