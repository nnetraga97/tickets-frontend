import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App'
import './index.css'
import { AuthProvider } from "./store/auth";
import { SessionProvider } from './store/session';
import { LoggerProvider } from "./store/logger";
import { TraceProvider } from "./store/trace";
import { SearchProvider } from './store/search';
import { AlertProvider } from './store/alert';
import { registerServiceWorker } from "./sw/registerSW";
import { AlertsLiveProvider } from './store/alertsLive';
import { PerfProvider } from './store/perf';
import { initializeTracing } from './telemetry';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: false
    }
  }
});

registerServiceWorker();

// Initialize OpenTelemetry tracing
initializeTracing();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <TraceProvider>
          <LoggerProvider>
            <AuthProvider>
              <AlertProvider>
                <SessionProvider>
                  <SearchProvider>
                    <AlertsLiveProvider>
                      <PerfProvider>
                        <App />
                      </PerfProvider>
                    </AlertsLiveProvider>
                  </SearchProvider>
                </SessionProvider>
              </AlertProvider>
            </AuthProvider>
          </LoggerProvider>
        </TraceProvider>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  </React.StrictMode>,
);
