# ServiHub — Project Context

> Updated 2026-10-16, at the end of the development phase (branch
> `feat/complete-development`, merged into `demo/bug-showcase` through a pull
> request). It replaces the 2026-10-14 scan of the original code; what that
> scan found and how each item was resolved is in [§13](#13-issue-log).
>
> The code is the source of truth. Detailed references:
> [README.md](README.md) (setup, demo, deployment),
> [servihub-api/README-API.md](servihub-api/README-API.md) (endpoints, socket events, error codes),
> [servihub-api/SECURITY.md](servihub-api/SECURITY.md) (sessions, permissions, AI guardrails),
> [Servicehub-admin/CLAUDE.md](Servicehub-admin/CLAUDE.md) (design system, frontend conventions).

---

## 1. Purpose

ServiHub is an **internal admin panel for a home-services marketplace**: AC
repair, plumbing, electrical, deep cleaning, maid service and pest control.
Seed data is set in Austin, TX, with amounts in USD. Company staff use it to:

- watch the business on a dashboard (today / this week / this month)
- create and run bookings: schedule, assign or reassign a provider, start,
  complete or cancel
- maintain the provider and customer directories
- answer customer support chats in real time (Socket.IO)
- run an **AI Copilot** (Groq, `llama-3.3-70b-versatile`) on a ticket: summary,
  sentiment, refund eligibility citing the written refund policy, a suggested
  reply and next actions, all checked by server-side guardrails
- request refunds and approve or reject them
- manage the team: invite members, change roles, disable accounts

Customers and providers never sign in. The public **`/simulator`** page stands
in for a customer-facing chat widget so live support can be demoed end to end
(demo mode only).

**Typical demo flow:** the simulator opens a ticket → it appears live in the
agents' queue and notification bell → an agent runs Analyze → the Copilot
recommends, for example, "70% refund per Section 4" (capped by the guardrails
if the model asked for more) → the agent inserts the suggested reply, sends it
and files the refund → finance or a manager approves it on the Refunds page,
and the requester is notified live.

---

## 2. Status

**The development phase is complete.** Every feature in scope works end to end
for each role, and every issue from the 2026-10-14 scan is fixed (§13).

How that was verified on 2026-10-16:

- Automated: API unit + integration tests (302, against a real MongoDB), admin
  app tests (68), ESLint for both apps, the production build, all in CI on
  every push.
- Against a live API with seeded data: `npm run audit:rbac` (35 endpoints ×
  4 roles + anonymous, all as expected) and `npm run e2e` (36 steps pass; the
  real Groq call is skipped without a key).
- In a real browser against a real database, for all four roles: permissions
  and navigation, live support between the simulator and agents (typing,
  resolve, reopen, escalate), refunds with live notifications and balance
  caps, the booking lifecycle rules, invitations, role change and disable with
  live sign-out, forgot/reset password via the emailed (logged) link, change
  password and sign out everywhere, "Keep me logged in", silent refresh with
  8-second access tokens, Copilot role gating and guardrail display, global
  search and deep links, dashboard ranges, dark mode, a 390 px phone layout,
  and the 404 page.

What remains is outside development: deploying it and the scale-out and
hardening items in §14.

---

## 3. Repository layout

One git repository with two apps (the admin app used to be an unlinked nested
repo; its files are now tracked normally).

```
.
├── README.md                     # overview, screenshots, setup, demo accounts, deployment checklist
├── CONTEXT.md                    # this file
├── .github/workflows/ci.yml      # API: lint + tests (mongo:7 service); app: lint + tests + build
├── docs/screenshots/             # images used by README.md
├── servihub-api/                 # backend: Node, Express 5, ESM
│   ├── .env.example              # every variable, documented
│   ├── README-API.md  SECURITY.md
│   ├── scripts/
│   │   ├── rbac-audit.mjs        # live permission matrix check (changes nothing)
│   │   ├── e2e-journey.mjs       # live staff + customer journey (writes data)
│   │   └── create-admin.mjs      # first super admin / lock-out recovery (prints a password link)
│   ├── src/
│   │   ├── server.js             # connect Mongo → build app → attach Socket.IO → listen
│   │   ├── app.js                # middleware chain and route mounting
│   │   ├── config/               # env.js (zod-validated env), db.js, refundPolicy.js, services.js (service catalogue)
│   │   ├── middleware/           # auth.js, rbac.js (PERMISSIONS), simulator.js, validate.js, sanitizeInput.js,
│   │   │                         # rateLimiters.js, errorHandler.js, notFound.js
│   │   ├── routes/ controllers/ validators/   # one file per resource (auth, team, config, dashboard, bookings,
│   │   │                                      # providers, customers, refunds, tickets, search, health)
│   │   ├── models/               # User, Session, PasswordToken, Provider, Customer, Booking, Ticket, Refund, Counter
│   │   ├── services/             # session, passwordToken, email (Resend), googleAuth, aiAnalysis (Groq),
│   │   │                         # refundGuardrails, refund, ticket
│   │   ├── sockets/              # index.js (handshake, rooms, client events), emitter.js (every server → client emit)
│   │   ├── seed/                 # mockData.js, relativeDates.js, seed.js (wipes and reseeds)
│   │   └── utils/                # ApiError, asyncHandler, cookies, jwt, duration, generateCode, money, regex, timezone
│   └── tests/                    # unit/ and integration/ (supertest, socket.io-client, real MongoDB), helpers/, setup/
└── Servicehub-admin/             # frontend: React 19, Vite 8, Tailwind CSS 4
    ├── .env.example              # VITE_API_URL only; everything else comes from GET /api/config
    ├── CLAUDE.md                 # design system and engineering rules
    └── src/
        ├── main.jsx              # Router → QueryClient → Theme → Toast → Auth → Socket → Notification → App
        ├── App.jsx               # route table (lazy pages); /simulator renders outside the auth boot
        ├── index.css             # Tailwind v4 + design tokens (light/dark)
        ├── lib/                  # api.js (axios + silent refresh), socket.js, permissions.js (can, canViewPath),
        │                         # formatters.js, passwordRules.js, small hooks (useQueryParamState, useDismiss, ...)
        ├── context/              # Auth, Socket, Notification, Theme, Toast
        ├── hooks/                # TanStack Query hooks per resource + useTicketSocket
        ├── layouts/              # AppLayout, Sidebar, Topbar, RangePicker, NotificationsMenu, SidebarSearch,
        │                         # UserMenu, RealtimeBridge, AuthLayout, navigation.js
        ├── components/           # dashboard cards and chart, RequestRefundDialog, loaders
        │   └── ui/               # design-system primitives (Button, DataTable, Drawer, FormField, Select, ...)
        ├── pages/                # dashboard, bookings, providers, customers, support, refunds, settings, account,
        │                         # login, forgotPassword, resetPassword, simulator, errors
        └── test/                 # Vitest setup, render helper, mock API
```

### Tech stack

| Layer | Stack |
|---|---|
| API | Node ≥ 20.19, Express 5, Mongoose 9 (MongoDB), zod 4, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-mongo-sanitize, cookie-parser |
| Real-time | socket.io 4 / socket.io-client 4 |
| AI | groq-sdk, `llama-3.3-70b-versatile` (configurable), JSON mode |
| Email | Resend over HTTPS (logged to the console when not configured) |
| Google sign-in | google-auth-library (verify) + Google Identity Services (button) |
| Frontend | React 19, react-router-dom 7, @tanstack/react-query 5, axios, Recharts 3, lucide-react, clsx |
| Styling | Tailwind v4 via `@tailwindcss/vite`; Inter + JetBrains Mono |
| Tests | Vitest 5; supertest, socket.io-client and mongodb-memory-server (or `MONGODB_TEST_URI`) for the API; Testing Library + jsdom for the app |

---

## 4. Roles and permissions

Four staff roles: `super_admin`, `manager`, `support_agent`, `finance`.

- **One source of truth:** [`servihub-api/src/middleware/rbac.js`](servihub-api/src/middleware/rbac.js).
  Every protected route declares its permission (unknown names fail at boot).
- **The admin app has no copy of the matrix.** Every sign-in response and
  `GET /auth/me` include the caller's `permissions`; the app checks them with
  `can(user, permission)` and maps pages to permissions in `PAGE_PERMISSIONS`
  ([`lib/permissions.js`](Servicehub-admin/src/lib/permissions.js)). UI checks
  only hide things; the API enforces everything.

| Permission | super_admin | manager | support_agent | finance |
|---|:-:|:-:|:-:|:-:|
| `dashboard.read` | ✅ | ✅ | ✅ | ✅ |
| `booking.read` | ✅ | ✅ | ✅ | ✅ |
| `booking.create` | ✅ | ✅ | ❌ | ❌ |
| `booking.update` (edit, start, complete) | ✅ | ✅ | ❌ | ❌ |
| `booking.reassign` (reassign, cancel) | ✅ | ✅ | ❌ | ❌ |
| `provider.read` / `provider.manage` | ✅ | ✅ | ❌ | ❌ |
| `customer.read` / `customer.manage` | ✅ | ✅ | ❌ | ❌ |
| `refund.read` / `refund.request` | ✅ | ✅ | ✅ | ✅ |
| `refund.approve` | ✅ | ✅ | ❌ | ✅ |
| `ticket.read` (incl. AI analyze) / `ticket.reply` / `ticket.resolve` | ✅ | ✅ | ✅ | ❌ |
| `team.manage` | ✅ | ❌ | ❌ | ❌ |
| search, own profile, own password | ✅ | ✅ | ✅ | ✅ |

Pages: Dashboard `dashboard.read`, Bookings `booking.read`, Support
`ticket.read`, Refunds `refund.read`, Providers `provider.read`, Customers
`customer.read`, Settings `team.manage`; Account is open to everyone signed
in. A page reached by URL without its permission renders the Forbidden page.

Role-dependent details:

- The dashboard includes ticket KPIs and open tickets only with `ticket.read`,
  and pending refunds only with `refund.read`; global search only searches
  what the role can read.
- The booking page shows customer and provider details from the booking
  itself, so roles without the directories still see them (without "View
  profile" links).
- The Copilot only offers actions the role can take and the booking still
  allows (no "Reassign" for support agents or once work has started).
- Nobody can change their own role or status, and the last active super admin
  can't be demoted or disabled.

---

## 5. Seed data and demo accounts

`npm run seed` wipes the database and loads 6 staff, 12 providers, 18
customers, 55 bookings, 14 tickets and 7 refunds. The mock data was written
around 2026-07-11; the seed shifts every date by whole days so that day is
**today**, so the dashboard always shows current-looking activity.

All seeded staff use the password **`Demo@1234`**.

| Name | Email | Role |
|---|---|---|
| Ammar Khan | ammar.khan@servihub.com | super_admin |
| Brianna Lopez | brianna.lopez@servihub.com | manager |
| Derek Simmons | derek.simmons@servihub.com | manager |
| Madison Carter | madison.carter@servihub.com | support_agent |
| Tyler Brooks | tyler.brooks@servihub.com | support_agent |
| Jessica Nguyen | jessica.nguyen@servihub.com | finance |

With `DEMO_MODE` on (default outside production), the sign-in page offers
one-click demo access per role (`POST /auth/demo-login` signs in as the oldest
active user of that role) and the customer simulator is available.

On a database without demo data, `npm run create-admin -- --email ... --name
...` creates the first super admin and prints a single-use link to choose the
password.

---

## 6. Backend

### 6.1 Conventions

- Base URL `http://localhost:5000/api` in development; JSON bodies.
- Auth is **httpOnly cookies**, never bearer tokens: `accessToken` (path `/`,
  15 min JWT) and `sh_refresh` (path `/api/auth`). Clients send credentials.
- `:id` params are ObjectIds validated by zod; human codes (`BK-4801`,
  `TK-101`, `RF-31`) come from an atomic counter and are for display/search.
- Lists: `{ items, total, page, pages }`, `page` (default 1), `limit`
  (default 20, max 50).
- Errors: `{ message, code?, errors? }`. `errors` maps fields to messages on
  validation 400s; `code` is machine-readable (`AUTH_REQUIRED`,
  `TOKEN_EXPIRED`, `SESSION_REVOKED`, `SESSION_EXPIRED`, `ACCOUNT_DISABLED`,
  `FORBIDDEN`, `FEATURE_DISABLED`, `DUPLICATE`, ...; table in README-API.md).
  Rule violations are 409 with a message the app shows as is.

### 6.2 Routes

| Prefix | Purpose | Guard |
|---|---|---|
| `GET /health` | `{ status, db, uptime }`, 503 while the database is down | public |
| `GET /config` | demo mode, Google client id, AI/email availability, service catalogue, time zone | public |
| `/auth` | login (+ remember), Google, demo login, refresh (rotating), logout, logout-all, me, update profile, change password, forgot / verify / reset password | per route |
| `/team` | roster, invite (`POST /`), resend invite, change role, enable/disable | `team.manage` |
| `/dashboard/summary` | KPIs, trend, status breakdown, recent bookings, open tickets, pending refunds; `range` = today/week/month, `tz` | `dashboard.read` |
| `/bookings` | list/filter/sort, detail with refund summary, create, edit, start/complete, reassign, cancel | `booking.*` |
| `/providers` | list/filter, profile with earnings and jobs, create, edit | `provider.*` |
| `/customers` | list with lifetime totals, profile with bookings and tickets, create, edit | `customer.*` |
| `/refunds` | list with counts, detail, request, decide (with note) | `refund.*` |
| `/tickets` | staff: list, detail, reply, status, priority, AI analyze; simulator: options, open, resume, read, post | `ticket.*` / simulator token |
| `/search?q=` | bookings, customers, tickets (5 each), role-filtered | signed in |

Full request/response details: [README-API.md](servihub-api/README-API.md).

### 6.3 Sessions

Each sign-in creates a `Session` (one per device). Refresh tokens are single
use: every refresh rotates the session's `jti`; presenting an old one revokes
the session (replay detection), with a 30-second grace for two tabs
refreshing at once. Access tokens carry `sid` and `tv` (`tokenVersion`), and
every request (and socket handshake) checks that the user is active, the
`tokenVersion` still matches and the session is still open, through 60-second
in-process caches invalidated on change. Sign-out ends that device's session
(its access token stops working at once); sign out everywhere, password
change/reset, role change and disable bump `tokenVersion` and revoke every
session and live socket. Details: [SECURITY.md](servihub-api/SECURITY.md).

### 6.4 Real-time

Socket.IO runs on the API's HTTP server. Staff sockets authenticate with the
same cookies and checks as REST and join `user:<id>`, `session:<sid>`,
`agents` (with `ticket.read`) and `approvers` (with `refund.approve`); ticket
rooms need `ticket.read`. Simulator sockets exist only in demo mode and must
unlock each ticket with its token. Events: `ticket:new`, `ticket:message`,
`ticket:customer-message`, `ticket:updated`, `typing`, `refund:requested`,
`refund:decided` (payloads in README-API.md). All server emits go through
`sockets/emitter.js`, so a request never fails because the realtime layer
isn't running.

### 6.5 AI Copilot

`POST /tickets/:id/analyze` (`ticket.read`, 10/min per user):

1. Builds a prompt from the refund policy ([`config/refundPolicy.js`](servihub-api/src/config/refundPolicy.js)),
   booking facts and the conversation. Customer text is wrapped in
   `<ticket_messages>` delimiters with angle brackets neutralised, and the
   model is told to treat it as data.
2. Calls Groq in JSON mode and validates the answer with zod; one retry with a
   correction, then a generic 502.
3. Applies [`refundGuardrails.js`](servihub-api/src/services/refundGuardrails.js):
   caps the percentage by the cited section (§1 100%, §2 100%, §3 50%, §4 70%,
   §5 0%), zeroes it without a citation or outside the 7-day window (§6),
   removes actions the booking can't take, and lists each change in
   `guardrails`.
4. Stores the result on the ticket; the app shows it with the adjustments.

Without `GROQ_API_KEY` the endpoint answers 503 `FEATURE_DISABLED` and the
panel explains that the Copilot isn't configured.

### 6.6 Business rules enforced by the API

- **Bookings:** `pending → assigned → in_progress → completed`, or
  `cancelled` from pending/assigned. Only pending/assigned bookings can be
  edited, reassigned or cancelled; the provider must offer the service and be
  available; assigning a pending booking makes it assigned; the amount can't
  drop below refunds already approved or pending. Every change goes on the
  timeline with the staff member's name.
- **Refunds:** at most what is still refundable (amount − approved − pending);
  one pending request per booking (partial unique index); decisions are
  compare-and-swap and re-check the balance on approval.
- **Tickets:** the first agent reply moves an open ticket to in progress; a
  customer message on a resolved ticket reopens it; escalate sets priority
  high.
- **Team:** invitations and resets are single-use hashed tokens (7 days /
  1 hour); a new link invalidates the previous one.

### 6.7 Rate limits

In memory, per process: general API (per user, or per IP when signed out),
failed sign-ins, refresh, password reset, simulator and AI analysis. Numbers
in README-API.md; `DISABLE_RATE_LIMITS=true` is for automated tests only.

---

## 7. Data model (MongoDB)

All models use `timestamps` and no `__v`.

| Model | Key fields |
|---|---|
| **User** | `name`, `email` (unique, lowercase), `passwordHash`, `role`, `status` (`active`\|`disabled`), `tokenVersion`, `passwordSetAt` (null until an invitee sets a password), `lastLoginAt`, `invitedBy`. JSON never includes `passwordHash` or `tokenVersion`; virtual `invitePending` |
| **Session** | `user`, `jti`, `previousJti`, `rotatedAt`, `remember`, `expiresAt` (TTL index), `revokedAt`, `revokedReason`, `lastUsedAt`, `userAgent`, `ip` |
| **PasswordToken** | `user`, `tokenHash` (SHA-256, unique), `purpose` (`reset`\|`invite`), `expiresAt` (TTL index), `usedAt` |
| **Provider** | `name`, `phone`, `services[]` (≥ 1), `rating`, `jobsCompleted`, `isAvailable`, `verified`, `area`, `joinedAt` |
| **Customer** | `name`, `phone` (no two customers share one; checked by the API), `area`, `joinedAt`; totals are computed, never stored |
| **Booking** | `code` (`BK-####`), `customer`, `provider?`, `service`, `status`, `scheduledAt`, `amount`, `address`, `timeline[{ event, at, note?, actor? }]` |
| **Ticket** | `code` (`TK-###`), `booking`, `customer`, `subject`, `priority`, `status` (`open`\|`in_progress`\|`resolved`), `messages[{ from, senderName, text, at }]`, `aiAnalysis?` |
| **Refund** | `code` (`RF-##`), `booking`, `amount`, `reason`, `status`, `requestedBy`, `decidedBy`, `decidedAt`, `decisionNote` |
| **Counter** | `_id` (sequence name), `seq`, for atomic codes |

`aiAnalysis`: `summary`, `sentiment` (`calm`\|`neutral`\|`frustrated`\|`angry`),
`refundEligibility { eligible, percent, reason }`, `suggestedReply`,
`suggestedActions[]` (1–3 of `request_refund`\|`reassign_provider`\|`escalate`\|`no_action`),
`guardrails[]`, `analyzedAt`.

---

## 8. Frontend

### 8.1 Routes

| Path | Page | Access |
|---|---|---|
| `/login` | email/password, "Keep me logged in", Google (when configured), demo access (demo mode) | signed out |
| `/forgot-password` | request a reset link | signed out |
| `/reset-password?token=` | set a password from a reset or invitation link | anyone |
| `/dashboard`, `/bookings`, `/bookings/:id`, `/providers`, `/customers`, `/support`, `/refunds`, `/settings` | the app, inside `AppLayout` | signed in + page permission |
| `/account` | profile, change password, sign out everywhere | signed in |
| `/simulator` | customer simulator | public, demo mode |
| anything else | 404 page | |

Drawers and selections are deep-linkable: `/customers?customer=<id>`,
`/providers?provider=<id>`, `/refunds?refund=<id>`, `/support?ticket=<id>`.

### 8.2 Architecture

- **AuthContext** restores the session with `GET /auth/me`, exposes
  `user` (with `permissions`), sign-in/out helpers and the route guards.
  Signing out (or being signed out) clears cached data and shows the reason
  on the sign-in page.
- **`lib/api.js`** (axios) refreshes silently on `TOKEN_EXPIRED`,
  `AUTH_REQUIRED` or `INVALID_TOKEN` with one shared in-flight refresh, then
  retries; a failed refresh signs the user out with the reason.
- **SocketContext** owns one staff socket per signed-in user; when a
  handshake is refused for an expired token it refreshes the session and
  reconnects. **RealtimeBridge** turns socket events into query invalidations,
  notifications and toasts; **NotificationContext** keeps the bell's list per
  user in localStorage; **ToastContext** shows action results.
- **Data** goes through TanStack Query hooks in `hooks/` with structured keys
  (`["bookings", "list", params]`, `["bookings", "detail", id]`, ...);
  mutations invalidate the queries they affect.
- Pages are lazy-loaded; every list and drawer has loading, empty and error
  states; light/dark theme without a flash; layouts work down to phone width.
- Design tokens, component rules and primitives: [CLAUDE.md](Servicehub-admin/CLAUDE.md).

---

## 9. Features

- **Sign-in and account:** email/password with "Keep me logged in", Google
  for existing staff, demo access, forgot/reset password by email link,
  profile name, change password, sign out everywhere, silent session
  refresh, clear notices when a session ends.
- **Dashboard:** range picker (today / this week / this month, viewer's time
  zone) with KPI cards and deltas (bookings, revenue, active tickets,
  available providers), booking trend chart, bookings by status, recent
  bookings, open tickets, pending refunds, each by role.
- **Bookings:** server-side search, status tabs, service filter, sort,
  pagination; new booking (also from a customer's profile); detail page with
  timeline, customer, provider and payment cards; edit, mark started, mark
  completed, reassign, cancel with a reason, request refund.
- **Providers / customers:** searchable directories, profile drawers with
  stats and history, add and edit.
- **Support center:** queue (Open / In Progress / Resolved) with unanswered
  and analyzed markers, live conversation with typing indicators, start
  working, mark resolved, reopen, escalate; responsive drawers on small
  screens.
- **AI Copilot:** analyze / re-analyze, summary, sentiment, refund eligibility
  with amount, policy adjustments, suggested reply with "Insert into
  composer", role- and state-aware actions (request refund prefilled,
  reassign, escalate).
- **Refunds:** Pending / Approved / Rejected tabs with counts, new refund
  request with the refundable balance shown, detail drawer, approve/reject
  with an optional note, live updates.
- **Settings → Team:** roster with last sign-in and pending invites, add
  member (invitation link, emailed when configured), resend invitation,
  change role, enable/disable.
- **Notifications:** bell with unread count for new tickets, customer
  replies, refund requests (approvers) and decisions (requester).
- **Global search:** Ctrl/Cmd + K, bookings / customers / tickets, keyboard
  navigation, opens the exact record.
- **Customer simulator:** pick a customer, resume an open ticket or start one
  on a booking, live chat with typing.

---

## 10. Environment variables (names only)

### `servihub-api/.env` (see `.env.example`)

Validated at boot by [`src/config/env.js`](servihub-api/src/config/env.js); the
API refuses to start with a message naming each problem. Blank values count
as "not set".

| Name | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `CLIENT_URL` | yes | Allowed browser origin(s), comma-separated; the first is used in email links |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | yes, ≥ 32 chars, different | Token signing |
| `NODE_ENV`, `PORT` | no (`development`, `5000`) | Production turns on Secure cookies, hides stack traces, defaults demo mode off |
| `ACCESS_TOKEN_TTL`, `REFRESH_TOKEN_TTL`, `SESSION_TOKEN_TTL` | no (`15m`, `30d`, `12h`) | Access token; session with / without "Keep me logged in" |
| `COOKIE_SAMESITE`, `COOKIE_DOMAIN` | no (`lax`, unset) | Cookie scope for the hosting setup |
| `GROQ_API_KEY`, `GROQ_MODEL` | no | AI Copilot |
| `GOOGLE_CLIENT_ID` | no | Google sign-in (also sent to the app via `/config`) |
| `RESEND_API_KEY`, `EMAIL_FROM`, `RESET_PASSWORD_URL_BASE` | no | Reset and invitation emails, link base |
| `DEMO_MODE` | no (on outside production) | Demo login and customer simulator |
| `APP_TIMEZONE` | no (`America/Chicago`) | Dashboard periods when the browser sends no time zone |
| `TRUST_PROXY` | no (`0`) | Proxies in front of the API, for real client IPs |
| `DISABLE_RATE_LIMITS` | no (`false`) | Automated tests only |

### `Servicehub-admin/.env`

| Name | Purpose |
|---|---|
| `VITE_API_URL` | API base including `/api`; its origin is also the Socket.IO URL. Baked in at build time. |

Everything else the app needs (demo mode, Google client id, AI/email
availability, services, time zone) comes from `GET /api/config` at runtime.

---

## 11. Tests, CI and scripts

| Command | Where | What |
|---|---|---|
| `npm test` | `servihub-api` | Unit + integration tests. Integration tests use `MONGODB_TEST_URI` or download MongoDB via mongodb-memory-server; each file gets its own database. |
| `npm test` | `Servicehub-admin` | Component and logic tests (permissions, formatters, the refresh interceptor, dialogs, Copilot gating, sign-in) |
| `npm run lint` | both | ESLint flat config |
| `npm run build` | `Servicehub-admin` | Production build to `dist/` |
| `npm run seed` | `servihub-api` | Wipe and reseed |
| `npm run audit:rbac` | `servihub-api` | Live permission matrix check, read-only (needs demo mode) |
| `npm run e2e` | `servihub-api` | Live end-to-end journey; writes data, re-seed afterwards (needs demo mode) |
| `npm run create-admin` | `servihub-api` | Create or restore a super admin and print a password link |

CI (`.github/workflows/ci.yml`) runs on every push and on pull requests to
`main` and `demo/bug-showcase`: the API job lints and tests against a
`mongo:7` service; the app job lints, tests and builds.

---

## 12. Running locally

See [README.md](README.md#run-it-locally). In short: copy both `.env.example`
files, set `MONGODB_URI` and two JWT secrets, `npm install` in both apps,
`npm run seed`, then `npm run dev` in each (API on 5000, app on 5173).

---

## 13. Issue log

### 13.1 Issues from the 2026-10-14 scan — all resolved

| # | Issue | Resolution |
|---|---|---|
| 1 | Silent refresh never fired: the access cookie expired with the token, so the API saw "no token" | The cookie outlives the JWT, so expiry returns `TOKEN_EXPIRED`; the client refreshes on that and on `AUTH_REQUIRED`. Verified in a browser with 8-second tokens. |
| 2 | Password-less demo login always on | Only with `DEMO_MODE` (default off in production); 404 otherwise |
| 3 | Refresh tokens never rotated or revoked; logout only cleared cookies | Session records, single-use rotating refresh tokens, replay detection, server-side logout, logout-all |
| 4 | Simulator could read and post to any ticket | Demo mode only, per-ticket signed tokens for REST and sockets |
| 5 | Socket auth trusted the JWT only | Same live checks as REST; permission-based rooms; sockets dropped on disable, role change and sign-out |
| 6 | Refunds could exceed the booking amount | Refundable balance check on request and approval, partial unique index, compare-and-swap decisions |
| 7 | Reassign ignored booking status and provider service | Status, service and availability rules; pending → assigned |
| 8 | Copilot offered "Reassign" to support agents | Actions gated by permission and booking state, in the API guardrails and the UI |
| 9 | Booking page showed "No customer found" to roles without customer access | Customer and provider cards use the booking response |
| 10 | Dashboard empty with seed data; trend chart off by a day | Seed dates shift to today; periods computed in the viewer's time zone; range picker |
| 11 | Code generation race (read max + 1) | Atomic `Counter` sequences |
| 12 | Customer totals from at most 50 bookings | Aggregated over the whole history |
| 13 | Failed agent message lost silently | Draft kept, error shown; toasts for actions |
| 14 | Prompt injection could steer refund advice | Delimited untrusted input, JSON mode + schema, server-side guardrails |
| 15 | Admin app was a gitlink without `.gitmodules` | Files tracked in this repository |
| 16 | Env hygiene, no `.env.example` | Documented `.env.example` for both apps and strict validation with clear messages. `RESEND_API_KEY` and `RESET_PASSWORD_URL_BASE` are now used; the app gets the Google client id from `/api/config`, so `VITE_GOOGLE_CLIENT_ID` is gone |
| 17 | Dead code (`useMockLoad.js`, `src/data/`) | Removed |
| — | Stubbed features (forgot password, add member, keep me logged in, range button, bell, ticket status, deep links, refunds outside the Copilot, create/edit records, password change) | All implemented (§9) |
| — | Documentation drift | README-API.md, SECURITY.md and CLAUDE.md rewritten to match the code |

### 13.2 Found and fixed during final verification (2026-10-16)

- An access token kept working after its session was signed out (up to its
  15-minute lifetime). Access checks now also confirm the session is open.
- On phones, table cells wrapped mid-value (`BK-` / `4801`); rows now stay on
  one line and tables scroll sideways.
- Global search results were clipped to the sidebar width; the list now opens
  wider.
- Status badges and role names showed raw values (`IN_PROGRESS`, `OFF_DUTY`,
  `SUPER_ADMIN`); they now read IN PROGRESS, OFF DUTY and Super Admin.
- A blank optional value in `.env` (as in `.env.example`) stopped the API from
  starting; blanks now mean "not set".

---

## 14. Known limitations and next steps

Accepted for the current scope (see SECURITY.md → Known limitations):

- **Single API instance.** Auth/session caches and rate-limit counters are in
  process memory, and Socket.IO has no shared adapter. Scaling out needs a
  shared store such as Redis (caches, rate limits, Socket.IO adapter).
- **No CSRF token**: relies on `sameSite=lax` cookies plus strict CORS. Add
  one if the app and API must live on unrelated domains
  (`COOKIE_SAMESITE=none`).
- **No account lockout or 2FA**: failed sign-ins are rate limited per IP.
- **Demo mode is intentionally open**: never enable it on real data.

Next steps, in order:

1. **Deploy**: MongoDB Atlas, the API on a Node host (Render, Railway, Fly.io,
   a VM), the app as static files (Vercel, Netlify, Cloudflare Pages). Follow
   the checklist in README.md → Deploying; create the first admin with
   `npm run create-admin`.
2. **Integrations**: a Groq key, a Resend key with a verified sending domain,
   and a Google OAuth client whose authorized origin is the app's URL.
3. **After launch**: error monitoring and structured logs, database backups,
   uptime checks.
4. **Later**: browser end-to-end tests in CI (Playwright), an audit log of
   admin actions, an admin-issued password reset link for members (today a
   forgotten password needs email delivery, or `create-admin` for super
   admins), Redis for multiple instances, 2FA for super admins.

---

## 15. Decisions worth knowing

- **Cookies, not localStorage**, for tokens; the access cookie outlives its
  JWT on purpose so expiry is reported, not hidden.
- **The API sends each user their permissions**; the frontend never keeps a
  second role matrix.
- **The API owns every rule.** The UI hides what a role can't do and explains
  conflicts, but the 409s come from the server.
- **Optional integrations degrade gracefully**: missing Groq, Google or
  Resend configuration never stops the app; the feature says it's off, and
  emails are printed in development.
- **AI output is advice, never action**: validated, policy-checked on the
  server, and always applied by a person.
- **Seed data is relative to today**, so a demo always looks current.
- **Times are shown in the viewer's time zone**; the dashboard asks the API
  for periods in that zone.
