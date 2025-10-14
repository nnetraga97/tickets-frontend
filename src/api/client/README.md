# API Client - Modular Architecture

A clean, maintainable HTTP client with comprehensive logging, retry logic, and caching.

## 📁 File Structure

```
client/
├── README.md           # This file
├── index.ts            # Main entry point - exports everything
├── config.ts           # Configuration and URL building
├── types.ts            # TypeScript type definitions
├── headers.ts          # Header management and tracing
├── cache.ts            # HTTP caching with ETags
├── retry.ts            # Retry strategy with exponential backoff
├── logging.ts          # Comprehensive request/response logging
└── fetch.ts            # Core HTTP implementation
```

## 🎯 Design Principles

1. **Single Responsibility**: Each file has one clear purpose
2. **Separation of Concerns**: Logic is grouped by functionality
3. **Readability**: Small, focused modules are easier to understand
4. **Maintainability**: Changes to one feature don't affect others
5. **Testability**: Each module can be tested independently

## 📦 Modules

### `config.ts` - Configuration
- `API_CONFIG`: Centralized configuration object
- `getFullUrl()`: URL building logic
- Environment variable handling

### `types.ts` - Type Definitions
- `FetchOptions`: HTTP request options
- `RequestContext`: Request tracking data
- `CacheEntry`: Cache structure

### `headers.ts` - Header Management
- `setTraceHeaderSupplier()`: Configure distributed tracing
- `buildHeaders()`: Build complete header set
- Automatic trace header injection

### `cache.ts` - HTTP Caching
- `HttpCache` class: ETag-based caching
- `httpCache` singleton: Global cache instance
- Conditional GET request support

### `retry.ts` - Retry Strategy
- `RetryStrategy` class: Retry logic
- Exponential backoff calculation
- Retryable error detection

### `logging.ts` - Request Logging
- `RequestLogger` class: Comprehensive logging methods
- Request start/end logging
- Error classification and logging
- Performance timing

### `fetch.ts` - Core HTTP Client
- `fetchJson()`: Main HTTP method
- `postJson()`: POST helper
- `putJson()`: PUT helper
- `deleteJson()`: DELETE helper
- Integrates all other modules

## 🚀 Usage

### Basic Usage

```typescript
import { fetchJson, postJson } from '@/api/client';

// GET request
const data = await fetchJson('/api/tickets');

// POST request
const result = await postJson('/api/tickets', {
  title: 'New Ticket',
  description: 'Issue description'
});
```

### With Options

```typescript
import { fetchJson } from '@/api/client';

const data = await fetchJson('/api/tickets/123', {
  signal: abortController.signal,
  metaname: 'get_ticket_detail',
  headers: {
    'X-Custom-Header': 'value'
  }
});
```

### Configure Tracing

```typescript
import { setTraceHeaderSupplier } from '@/api/client';

setTraceHeaderSupplier(() => {
  return `00-${traceId}-${spanId}-01`;
});
```

### Access Cache

```typescript
import { httpCache } from '@/api/client';

// Check cache
const cached = httpCache.get('GET', '/api/tickets');

// Clear specific entry (if needed)
// Note: Cache is managed automatically
```

## 🔍 Features

### Automatic Retries
- Retries 400 and 5xx errors
- Exponential backoff (200ms, 400ms, 600ms)
- Configurable retry attempts

### Smart Caching
- ETag-based HTTP caching
- Automatic 304 Not Modified handling
- GET requests only

### Comprehensive Logging
Every request logs:
- Request initiation with unique ID
- Each retry attempt
- Response status and timing
- Cache hits
- Errors with full context
- Final success/failure

### Distributed Tracing
- W3C Trace Context format
- Automatic trace header injection
- Request correlation

## 🛠️ Development

### Adding New Features

1. **New configuration?** → Add to `config.ts`
2. **New HTTP method?** → Add to `fetch.ts`
3. **New logging event?** → Add to `logging.ts`
4. **New retry logic?** → Add to `retry.ts`

### Testing Individual Modules

```typescript
import { RetryStrategy } from '@/api/client/retry';
import { RequestLogger } from '@/api/client/logging';

// Test retry logic
const shouldRetry = RetryStrategy.shouldRetry(1, 3, 500);

// Test logging (with mock logger)
RequestLogger.logRequestStart(mockContext, false);
```

## 📊 Logging Examples

```typescript
// Request start
[INFO] api_request_start { requestId, method, path, url }

// Retry attempt
[INFO] api_retry_attempt { requestId, attempt, previousError }

// Response received
[INFO] api_response_received { status, duration_ms }

// Cache hit
[INFO] api_cache_hit { requestId, duration_ms }

// Success
[INFO] api_request_success { requestId, dataSize, duration_ms }

// Error
[ERROR] api_request_failed_all_retries { requestId, attempts }
```

## 🔧 Configuration

Environment variables (`.env`):

```bash
VITE_API_BASE_URL=https://api.example.com
VITE_USE_MOCK=false
```

Code configuration:

```typescript
export const API_CONFIG = {
    BASE_URL: '...',
    USE_MOCK: false,
    RETRY_ATTEMPTS: 3,
    RETRY_BASE_DELAY_MS: 200,
    REQUEST_TIMEOUT_MS: 30000,
} as const;
```

## 📈 Performance

- Minimal overhead from logging
- Efficient caching reduces network calls
- Smart retry logic prevents unnecessary attempts
- Request deduplication via cache

## 🔒 Security

- Never logs sensitive data (tokens, passwords)
- HTTPS enforced for production
- CORS-compliant
- Supports authentication headers

## 🐛 Debugging

1. **Check console logs** - All requests logged with color coding
2. **Use requestId** - Track requests across the system
3. **Check `/logs` page** - View all persisted logs
4. **Inspect cache** - Use `httpCache.get()` to check cached data

## 📚 Related Files

- `../tickets.ts` - Ticket-specific API calls
- `../actions.ts` - User action APIs
- `../alerts.ts` - Alert/notification APIs
- `../attachments.ts` - File attachment APIs
- `../../store/logger.tsx` - Logging infrastructure

