# Backend integration & roles

## Environment

Copy `.env.example` → `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:4000/api/v1
```

Backend: copy `crm-server-beta/.env.example` → `.env` and set `MONGO_URL`, `SECRET_KEY`, `ZEPTOMAIL_*`, optional `PAYSTACK_*`.

Register a platform user:

```http
POST /api/v1/auth/sartor/register
{ "fullName": "...", "email": "...", "password": "...", "platformRole": "super" }
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
3. **Dev-only** — top “Internal role” bar switches UI for demos; production should rely on login role only.
4. **Nav is not yet permission-filtered** — hiding a link does not replace server checks; unauthorized API calls still fail with 403.

### Tenant roles (separate)

Client companies use `model-admin` (**Owner**) and `model-user` (Sales Rep, etc.) on `/api/v1/*` — **not** `platformRole`. Do not use tenant “Super-Admin” for platform console access.

---

## What should be real data from the backend

Treat every number in the design as **eventually** from API. Today:

**Already live in UI (via `PlatformProvider`):** Overview cards, client list, client detail (fetch), onboarding pipeline, investigations, support tickets, DORA awaiting queue, onboard wizard POST.

**Live API but UI still shows mock in places:** Finance page tables, Reports tabs, Settings staff table, AIML dashboard, Ops/AM dashboards, DORA “in training” / “review” tabs, sidebar badges (hardcoded counts in `roles.ts`).

**Backend placeholders to replace with real metrics:** `platformAuthRate`, health uptime/p95/SMS, overview chart time-series.

When wiring remaining screens, use `usePlatform()` or `platformApi.*` — do not read from `src/data/*.ts` except as TypeScript shapes.
