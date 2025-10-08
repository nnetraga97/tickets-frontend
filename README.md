🎟️ Tickets Frontend

A production-ready, Apple-inspired, enterprise-grade frontend for managing and analyzing New Mexico Health Care Authority benefit tickets (Medicaid, SNAP, TANF, etc.).

This frontend is designed for speed, traceability, and developer ergonomics, integrating seamlessly with a Spring Boot 3 backend powered by Postgres, Redis, Zipkin, S3, and Selenium for data scraping.

⸻

🧭 Overview

The Tickets Frontend provides a high-performance, data-driven UI for Tier 1 and Tier 2 support teams. It enables viewing, filtering, and managing incidents with real-time updates, virtualized tables, ETag/304 caching, and distributed tracing.

Developers will find this project modular, typed, cache-friendly, and production-scalable, following best practices for React, TypeScript, TanStack Query, Tailwind CSS, and Framer Motion.

⸻

🚀 Core Features

🧩 Architecture & Design
	•	Vite + React + TypeScript: Ultra-fast dev server, modular build, full type safety.
	•	TanStack Query (React Query): SWR caching, background revalidation, retries, optimistic updates.
	•	TanStack Table + Virtual: Handles 50k+ rows smoothly; scroll virtualization + pagination.
	•	Tailwind CSS: Apple-inspired glassmorphism, responsive UI, dark/light theming support.
	•	Framer Motion: Smooth animations for transitions, modals, dropdowns, and notifications.
	•	Service Worker: Static asset caching and offline fallbacks.
	•	React Context + Hooks: Clean global state management (NavigationContext, TracingContext, etc.).
	•	OpenTelemetry Headers: Propagates traceparent header to backend for Zipkin trace correlation.
	•	ETag Support: Integrates with backend’s conditional GETs (304 responses) to minimize bandwidth.
	•	Error Boundaries + Logging Hooks: Captures frontend errors to backend fw_errors endpoint.

⸻

🗂️ Directory Structure

src/
├── app/
│   ├── App.tsx                # Root component
│   ├── providers/             # React Query, Router, Tracing, Theme
│   ├── router/                # Route definitions
│   └── context/               # Global contexts (Nav, Trace, Auth)
│
├── components/
│   ├── Navbar.tsx             # Glassy Apple-like navigation bar
│   ├── Table.tsx              # Virtualized table wrapper
│   ├── ErrorBoundary.tsx      # Global error boundary
│   └── LoadingSpinner.tsx
│
├── features/
│   ├── tickets/               # Tickets listing & detail views
│   │   ├── api/               # REST clients for tickets
│   │   ├── pages/             # Home, Tier1, Tier2, etc.
│   │   ├── hooks/             # useTickets, useTicketDetails
│   │   └── components/        # TicketTable, TicketDetails
│   └── auth/                  # Mock login + guard
│
├── lib/
│   ├── apiClient.ts           # Fetch wrapper with interceptors
│   ├── tracing.ts             # Injects traceparent headers
│   ├── logger.ts              # Frontend logging abstraction
│   ├── env.ts                 # Env var parser (VITE_*)
│   └── utils.ts
│
├── hooks/                     # Shared composable hooks
│   ├── useTraceparent.ts
│   ├── usePagination.ts
│   └── useDebounce.ts
│
├── styles/
│   ├── index.css              # Tailwind base + custom tokens
│   └── tailwind.css
│
├── types/
│   └── ticket.ts              # Ticket, Attachment, User types
│
├── main.tsx                   # Entry file
└── vite-env.d.ts


⸻

⚙️ Environment Variables

Create a .env.local:

VITE_API_BASE_URL=http://localhost:8080
VITE_ATTACHMENTS_CDN_BASE=http://localhost:4566/tickets-attachments
VITE_ENABLE_TRACING=true
VITE_APP_SERVICE_NAME=tickets-frontend
VITE_QUERY_STALE_TIME=30000
VITE_QUERY_REFETCH_INTERVAL=60000
VITE_ENABLE_VIRTUALIZATION=true
VITE_ENABLE_COLUMN_PREFERENCES=true
VITE_ENABLE_MOCK_AUTH=false

Only variables prefixed with VITE_ are available in the client code.

⸻

🧠 Data Model (Frontend)

export interface Ticket {
  id: string;
  incidentType: string;
  incidentId: string;
  status: string;
  description: string;
  subcategory: string;
  ownedBy: string;
  createdDate: string;
  summary: string;
  priority: string;
  createdBy: string;
  closedDate?: string;
  category: string;
  service: string;
  lastModified: string;
  customerDisplayName: string;
  resolution?: string;
  journalNotes?: string;
  resolvedBy?: string;
  attachments?: Attachment[];
}

export interface Attachment {
  id: string;
  filename: string;
  s3Key: string;
  size: number;
}


⸻

🧭 Navigation Structure

Page	Route	Description
Home	/	All tickets
Tier 1	/tier1	Tickets owned by Tier 1
Tier 2	/tier2	Tickets owned by Tier 2
Daily Incoming	/daily-incoming	Tickets created today
Category	/category/:name	Filtered by category
Subcategory	/subcategory/:name	Filtered by subcategory
Ticket Details	/tickets/:id	Full ticket view


⸻

🧩 API Client Design
	•	Built with native fetch + AbortController
	•	Automatically injects traceparent (if VITE_ENABLE_TRACING=true)
	•	Supports ETag caching
	•	Centralized error handling & logging to backend
	•	Integrated with TanStack Query for caching, retries, and SWR

Example:

export async function fetchTickets() {
  const response = await apiClient.get("/tickets", { cache: "no-cache" });
  return response.json();
}


⸻

🧭 Tracing Integration (Zipkin / OpenTelemetry)

The frontend generates and sends traceparent headers with each API request.
This allows Zipkin to connect frontend actions (user interactions) with backend spans.
	•	Header format: traceparent: 00-<trace-id>-<span-id>-01
	•	Enabled via VITE_ENABLE_TRACING=true

You can inspect traces in Zipkin UI (e.g. http://localhost:9411).

⸻

🧰 Commands

Command	Description
npm install	Install dependencies
npm run dev	Start local dev server (http://localhost:5173)
npm run build	Create production build
npm run preview	Serve production build
npm run lint	Run ESLint
npm run typecheck	Run TypeScript checks


⸻

🧱 Build & Deployment

Production Build

npm run build

Outputs to /dist.

Preview

npm run preview

Serve with Backend (Recommended)

Backend CORS must allow Vite origin:

@CrossOrigin(origins = "http://localhost:5173")


⸻

🧪 Testing (Optional Setup)

Add Vitest or Jest:

npm install -D vitest @testing-library/react @testing-library/jest-dom

Example:

npm run test


⸻

🧰 Developer Tips
	•	Use TanStack Query Devtools for cache inspection.
	•	Enable React Developer Tools for component debugging.
	•	Use Redux DevTools only if global state expands.
	•	Enable trace logs in Network tab to inspect distributed tracing.
	•	Always run npm run typecheck before commits.

⸻

🧭 Future Enhancements
	•	✅ Persistent column preferences (localStorage)
	•	✅ Advanced filters (date range, status)
	•	🛠️ Role-based access (Admin, Tier 1, Tier 2)
	•	🧠 AI-assisted ticket similarity (embedding search)
	•	📊 Dashboard metrics (Open vs Closed, SLA breaches)
	•	💾 Offline caching of last view

⸻

👥 Contributing
	1.	Fork the repository
	2.	Create a feature branch

git checkout -b feature/my-feature


	3.	Commit changes

git commit -m "Add new feature"


	4.	Push

git push origin feature/my-feature


	5.	Create a PR

⸻

🛠️ Tech Stack Summary

Layer	Technology	Purpose
UI	React + TypeScript	Component-based SPA
Styling	Tailwind CSS	Utility-first, Apple-inspired
Animations	Framer Motion	Motion design
Data Fetching	TanStack Query	SWR caching
Tables	TanStack Table/Virtual	Massive list virtualization
Dev Server	Vite	Fast HMR
Tracing	Zipkin (traceparent)	Distributed tracing
Caching	ETag + Redis (BE)	Efficient sync
Storage	S3 / LocalStack	Attachments
Monitoring	fw_logs / fw_errors	Frontend → backend logs
