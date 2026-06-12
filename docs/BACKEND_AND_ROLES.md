# Backend integration & roles

## Environment

Copy `.env.example` → `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Backend: copy `crm-server-beta/.env.example` → `.env` and set `MONGO_URL`, `SECRET_KEY`, `ZEPTOMAIL_*`, optional `PAYSTACK_*`, `PLATFORM_CONSOLE_URL`.

Register a platform user:

```http
POST /api/v1/auth/sartor/register
{ "fullName": "...", "email": "...", "password": "...", "platformRole": "super" }
```

Or seed the default super admin:

```bash
cd crm-server-beta && npm run seed:super-admin
```

Login (super-admin app):

```http
POST /api/v1/auth/login
→ accountType must be "sartor"
→ use header s-token on all /api/v1/sartor/* calls
```

Full field → API mapping: see `crm-server-beta/docs/PLATFORM_DATA_MAP.md`.

---

## Roles feature (implemented)

### What it is

**Platform roles** control **Sartor Ltd internal** users (`model-sartor`), not client company users.

- Stored on each staff record: `platformRole`
- Returned on login as `platformRole`
- Enforced on the **server** on every `/api/v1/sartor/*` route via `platformRoleMiddleware(permission)`
- **Account Managers** only see clients where `assignedAm` equals their user id (`clientScopeFilter`)

### The six roles

| `platformRole` | UI label | Purpose |
|----------------|----------|---------|
| `super` | CEO / Super Admin | Full access; staff create/edit; settings write |
| `ops` | Operations Manager | Clients, onboarding, DORA queue, support, investigations read |
| `am` | Account Manager | **Scoped** clients + onboarding + support read |
| `finance` | Finance Admin | Invoices, subscriptions, credit sales, reports |
| `aiml` | AI/ML Lead | DORA queue + stats, clients read |
| `support` | Platform Support | Tickets + investigations write, clients read |

### Permissions (server)

Defined in `crm-server-beta/core/platform.roles.js`:

- `super` → `*` (all permissions)
- Others → explicit list, e.g. `clients:read`, `finance:write`, `dora:write`, `staff:write` (super only)

If a role calls an endpoint without permission → **403**.

### Frontend behaviour

1. **Login** — only `accountType === "sartor"` is accepted.
2. **`platformRole` from API** sets `AppContext` role → sidebar nav from `constants/roles.ts`.
3. **Route guards** — `RoleGuard` blocks paths outside the role’s nav.
4. **Sidebar badges** — live counts from `PlatformProvider` (attention clients, onboarding, DORA queue, investigations, support tickets).
5. **Nav is not a security boundary** — hiding a link does not replace server checks; unauthorized API calls still fail with 403.

### Tenant roles (separate)

Client companies use `model-admin` (**Owner**) and `model-user` (Sales Rep, etc.) on `/api/v1/*` — **not** `platformRole`. Do not use tenant “Super-Admin” for platform console access.

---

## What is live from the backend

`PlatformProvider` loads on app start via `Promise.allSettled` (partial 403s do not break the shell).

| Area | API | UI |
|------|-----|-----|
| Overview cards & health | `GET /sartor/overview` | OverviewPage |
| Scan volume chart | `GET /sartor/charts` | OverviewPage |
| Ops health timeline | `GET /sartor/charts` | OpsDashboardPage |
| Clients list & detail | `GET /sartor/clients`, `GET /sartor/clients/:code` | Clients, ClientDetail |
| Onboarding | `GET/POST/PATCH /sartor/onboarding`, `POST /sartor/onboard` | Onboarding, OnboardWizard |
| Finance | `GET /sartor/finance/summary`, invoices CRUD | FinancePage |
| Revenue charts | `GET /sartor/charts` + invoice rollups | Finance, Reports |
| Reports tabs | overview + clients + invoices + tickets + investigations | ReportsPage |
| DORA queue | `GET /sartor/dora/queue`, `GET /sartor/dora/stats` | AimlQueue, AimlDashboard |
| Investigations | `GET/POST/PATCH /sartor/investigations` | InvestigationsPage |
| Support | `GET/POST/PATCH /sartor/tickets` | SupportPage, TicketDetailModal, assign modal |
| Client team users | `POST/PATCH /sartor/clients/:id/users` | TeamMemberModal |
| Pilot conversion | `POST /sartor/clients/:id/convert-pilot` | Convert modal |
| DORA label actions | `PATCH /sartor/dora/labels/:id`, `POST …/resubmit` | AIML queue, upload/review modals |
| Settings & staff | `GET/PATCH /sartor/settings`, `GET/POST/PATCH /sartor/staff` | SettingsPage, StaffModal |
| Follow-up email | `POST /sartor/clients/:id/follow-up` | FollowUpModal |
| Create invoice | `POST /sartor/invoices` | InvoiceModal |
| Staff welcome email | sent on `POST /sartor/staff` | StaffModal create |

**Still placeholder / static in places:** health uptime/p95/SMS in overview are static estimates until real telemetry is wired; notifications panel is UI-only; DORA upload uses logged placeholder image URIs (no multipart file store yet).

When wiring new screens, use `usePlatform()` or `platformApi.*` — do not read from `src/data/*.ts` except as TypeScript shapes.
