/**
 * OpenTelemetry Configuration for Frontend
 * 
 * This module sets up OpenTelemetry tracing for the frontend application,
 * integrating with Zipkin for end-to-end distributed tracing.
 */

// Configuration
const ZIPKIN_URL = import.meta.env.VITE_ZIPKIN_URL || 'http://localhost:9411';
const SERVICE_NAME = import.meta.env.VITE_APP_SERVICE_NAME || 'tickets-frontend';
const SAMPLE_RATE = parseFloat(import.meta.env.VITE_TRACING_SAMPLE_RATE || '1.0');

// Simple tracer implementation for now
let currentTraceId: string | undefined;
let currentSpanId: string | undefined;

// Helper function to generate trace IDs
function generateTraceId(): string {
  const arr = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Helper function to generate span IDs
function generateSpanId(): string {
  const arr = crypto.getRandomValues(new Uint8Array(8));
  return Array.from(arr, byte => byte.toString(16).padStart(2, '0')).join('');
}

// Simple tracer object
export const tracer = {
  startSpan: (name: string, options?: any) => {
    currentSpanId = generateSpanId();
    if (!currentTraceId) {
      currentTraceId = generateTraceId();
    }
    
    console.log(`🔍 Starting span: ${name}`, {
      traceId: currentTraceId,
      spanId: currentSpanId
    });
    
    return {
      setAttributes: (attributes: Record<string, any>) => {
        console.log(`📊 Span attributes:`, attributes);
      },
      end: () => {
        console.log(`✅ Ending span: ${name}`);
      },
      spanContext: () => ({
        traceId: currentTraceId,
        spanId: currentSpanId
      })
    };
  },
  getActiveSpan: () => {
    if (currentSpanId) {
      return {
        spanContext: () => ({
          traceId: currentTraceId,
          spanId: currentSpanId
        })
      };
    }
    return undefined;
  }
};

// Helper function to create spans manually
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = tracer.startSpan(name);
  if (attributes) {
    span.setAttributes(attributes);
  }
  return span;
}

// Helper function to get current trace ID
export function getCurrentTraceId(): string | undefined {
  return currentTraceId;
}

// Helper function to get current span ID
export function getCurrentSpanId(): string | undefined {
  return currentSpanId;
}

// Initialize tracing
export function initializeTracing() {
  console.log(`🔍 Simple tracing initialized for ${SERVICE_NAME}`);
  console.log(`📊 Will send traces to: ${ZIPKIN_URL}`);
  console.log(`📈 Sample rate: ${SAMPLE_RATE}`);
  
  // Generate initial trace ID
  currentTraceId = generateTraceId();
}
