# Sartor Super Admin (Internal Console)

React prototype of **Sartor Ecosystem — Internal Console v9**, converted from `Sartor Ltd Chain_CRM Admin Console_v3.html`.

## Stack

- Vite + React 19 + TypeScript
- React Router 7
- Chart.js (platform & finance charts)

## Environment

```bash
cp .env.example .env.local
# VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Backend: see `crm-server-beta/.env.example` and run API on the same port.

Docs:

- `docs/BACKEND_AND_ROLES.md` — roles + what data is live
- `crm-server-beta/docs/PLATFORM_DATA_MAP.md` — screen-by-screen data sources
- `crm-server-beta/docs/PLATFORM_API.md` — endpoint list

## Run locally

```bash
npm install
npm run dev
```

Open the URL shown in the terminal (typically `http://localhost:5173`).

## Build

```bash
npm run build
npm run preview
```

## Features

- **6 demo roles** (CEO, Ops, AM, Finance, AI/ML, Support) with role-specific navigation
- **13 screens**: overview, clients, client detail (5 tabs), settings, investigations, reports (6 tabs), ops, onboarding, AM portfolio, finance (4 tabs), DORA AI, training queue, support
- **18 modals**: onboard wizard, invoices, follow-ups, investigations, CRM tier, seats, tickets, etc.
- **Live API** via `crm-server-beta` `/api/v1/sartor` (set `VITE_API_BASE_URL` in `.env`)
- Login with a **Sartor platform** account (`model-sartor`, `POST /auth/login`)

## Original reference

The static HTML prototype remains in the repo root for comparison.
