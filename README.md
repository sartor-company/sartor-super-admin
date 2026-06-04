# Sartor Super Admin (Internal Console)

React prototype of **Sartor Ecosystem — Internal Console v9**, converted from `Sartor Ltd Chain_CRM Admin Console_v3.html`.

## Stack

- Vite + React 19 + TypeScript
- React Router 7
- Chart.js (platform & finance charts)

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
- **Mock data** only — actions show toasts / print-style exports (no API)

## Original reference

The static HTML prototype remains in the repo root for comparison.
