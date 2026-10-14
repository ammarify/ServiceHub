# ServiHub — Project Context

> Written from a full scan of the repo on 2026-10-14 (branch `demo/bug-showcase`).
> The code is the source of truth. Where the existing docs (`Servicehub-admin/CLAUDE.md`,
> `servihub-api/README-API.md`, `servihub-api/SECURITY.md`) disagree with the code, this file
> follows the code and lists the drift in [§10.4](#104-documentation-drift).

---

## 1. Purpose

ServiHub is an **internal admin panel for a home-services marketplace**: AC repair, plumbing,
electrical, deep cleaning, maid service and pest control. Seed data is set in Austin, TX, and
amounts are in USD. Company staff use it to:

- monitor bookings, and reassign the provider or cancel a booking
- browse the provider and customer directories
- answer customer support tickets in real time (Socket.IO)
- run an **AI Copilot** (Groq, `llama-3.3-70b-versatile`) on a ticket. It returns a summary,
  sentiment, refund eligibility citing a written refund policy, a suggested reply and next actions
- request refunds, and approve or reject them
- manage staff roles and enable/disable staff accounts

Customers and providers never log in. The public **`/simulator`** page stands in for a
customer-facing chat widget so the live-support flow can be demoed end to end.

**Typical demo flow:** simulator opens a ticket → it appears live in an agent's queue → the agent
runs Analyze → the Copilot recommends e.g. "50% refund per Section 3" → the agent replies and files
a refund request → finance or a manager approves it on the Refunds page.

---

## 2. Repository layout

The repo holds two apps:

- **`servihub-api/`** is plain files in the parent repo.
- **`Servicehub-admin/`** is **its own git repo**. The parent commits it as a gitlink (mode
  `160000`) but has **no `.gitmodules`**, so a fresh clone of the parent gets an empty folder.
  See [§10.3](#103-bugs-and-gaps-found-in-this-scan).

```
ServiceHubProj/
├── .gitignore                    # ignores .env*, node_modules, dist/build, logs (whitelists .env.example)
├── CONTEXT.md                    # this file
├── servihub-api/                 # Backend — Node, Express 5, ESM
│   ├── README-API.md             # endpoint reference
│   ├── SECURITY.md               # auth design, threat model, RBAC matrix, audit log
│   ├── scripts/
│   │   ├── rbac-audit.mjs        # calls every protected route as 4 roles + anonymous, diffs against the expected matrix (no writes)
│   │   └── e2e-journey.mjs       # full staff journey against a live API (writes data, makes a real Groq call)
│   └── src/
│       ├── server.js             # boot: connect Mongo → build app → attach Socket.IO → listen
│       ├── app.js                # middleware chain + route mounting
│       ├── config/               # env.js (zod-validated env), db.js, refundPolicy.js (policy text shared by AI and humans)
│       ├── middleware/           # auth.js (requireAuth + 60s auth cache), rbac.js (PERMISSIONS map),
│       │                         # validate.js, sanitizeInput.js, rateLimiters.js, errorHandler.js, notFound.js
│       ├── routes/               # one *.routes.js per resource
│       ├── controllers/          # one *.controller.js per resource
│       ├── validators/           # zod schemas per resource; common.js (objectId, pagination, boolean query)
│       ├── models/               # Mongoose: User, Provider, Customer, Booking, Ticket, Refund
│       ├── services/             # aiAnalysis.service.js (Groq), googleAuth.service.js, ticket.service.js (appendMessage)
│       ├── sockets/index.js      # Socket.IO server: handshake auth, rooms, events
│       ├── seed/                 # mockData.js + seed.js (wipes and reseeds every collection)
│       └── utils/                # ApiError, asyncHandler, cookies, jwt, generateCode (BK-/TK-/RF- codes), regex escape
└── Servicehub-admin/             # Frontend — React 19, Vite 8, Tailwind v4 (separate git repo, see above)
    ├── CLAUDE.md                 # design system, engineering rules, phase history (partly stale)
    ├── index.html                # loads Google Identity Services; pre-hydration dark-mode script
    ├── vite.config.js
    ├── public/favicon.svg
    └── src/
        ├── main.jsx              # providers: Router → QueryClient → Theme → Auth → Notification
        ├── App.jsx               # route table; /simulator renders before the auth boot check
        ├── index.css             # Tailwind v4 + design tokens (light/dark)
        ├── lib/                  # api.js (axios + silent refresh), socket.js, permissions.js, formatters.js, small hooks
        ├── context/              # AuthContext (session + RequireAuth/RedirectIfAuthed), ThemeContext, NotificationContext
        ├── hooks/                # TanStack Query wrappers per resource + useTicketSocket.js
        ├── layouts/              # AppLayout (permission-checked <Outlet/>), Sidebar, Topbar, SidebarSearch (Cmd/Ctrl+K),
        │                         # UserMenu, AuthLayout, AuthBrandPanel, navigation.js
        ├── components/           # dashboard cards + chart, FullPageLoader
        │   └── ui/               # design-system primitives: Avatar, Button, Card, ConfirmDialog, DataTable, DetailField,
        │                         # Drawer, Input, Logo, QueryError, Skeleton, StatusBadge, Toolbar
        ├── pages/                # dashboard, bookings, providers, customers, support, refunds, settings,
        │                         # simulator, login, forgotPassword, errors
        └── data/                 # Phase 1 leftovers: pointer comments only, no data
```

### Tech stack

| Layer | Stack |
|---|---|
| API | Express 5, Mongoose 9 (MongoDB), zod 4, jsonwebtoken, bcryptjs, helmet, cors, express-rate-limit, express-mongo-sanitize, cookie-parser |
| Real-time | socket.io 4 (server) / socket.io-client 4 |
| AI | groq-sdk, model `llama-3.3-70b-versatile`, temperature 0.3 |
| Google sign-in | google-auth-library (backend verify) + Google Identity Services script (frontend button) |
| Frontend | React 19, react-router-dom 7, @tanstack/react-query 5, axios, Recharts 3, lucide-react, clsx |
| Styling | Tailwind v4 via `@tailwindcss/vite`; Inter + JetBrains Mono (`@fontsource-variable`) |
| Tests | none; only the two live-server scripts in `servihub-api/scripts/` |

---

## 3. Roles and permissions

Four staff roles (`User.role`): `super_admin`, `manager`, `support_agent`, `finance`.

- **Enforcement** happens in the backend: [`servihub-api/src/middleware/rbac.js`](servihub-api/src/middleware/rbac.js).
- **UI visibility only** comes from the frontend copy: [`Servicehub-admin/src/lib/permissions.js`](Servicehub-admin/src/lib/permissions.js).
  It decides which nav items, buttons and pages to show.
- The two maps are **not auto-synced**. Change both together.

### 3.1 Backend permissions (`PERMISSIONS` in rbac.js)

| Permission | super_admin | manager | support_agent | finance | Routes it guards |
|---|:-:|:-:|:-:|:-:|---|
| `dashboard.read` | ✅ | ✅ | ✅ | ✅ | `GET /dashboard/summary` |
| `booking.read` | ✅ | ✅ | ✅ | ✅ | `GET /bookings`, `GET /bookings/:id` |
| `booking.reassign` | ✅ | ✅ | ❌ | ❌ | `PATCH /bookings/:id/reassign`, `PATCH /bookings/:id/cancel` (no separate cancel permission) |
| `provider.read` | ✅ | ✅ | ✅ | ❌ | `GET /providers`, `GET /providers/:id` |
| `customer.read` | ✅ | ✅ | ❌ | ❌ | `GET /customers`, `GET /customers/:id` |
| `refund.read` | ✅ | ✅ | ✅ | ✅ | `GET /refunds`, `GET /refunds/:id` |
| `refund.request` | ✅ | ✅ | ✅ | ✅ | `POST /refunds` |
| `refund.approve` | ✅ | ✅ | ❌ | ✅ | `PATCH /refunds/:id/decision` |
| `ticket.read` | ✅ | ✅ | ✅ | ❌ | `GET /tickets`, `GET /tickets/:id`, `POST /tickets/:id/analyze` |
| `ticket.reply` | ✅ | ✅ | ✅ | ❌ | `POST /tickets/:id/messages` |
| `ticket.resolve` | ✅ | ✅ | ✅ | ❌ | `PATCH /tickets/:id/status`, `PATCH /tickets/:id/priority` |
| `team.manage` | ✅ | ❌ | ❌ | ❌ | all `/team` routes |
| *(auth only)* | ✅ | ✅ | ✅ | ✅ | `GET /search`, `GET /auth/me` |

`GET /search` runs each sub-search only for roles that hold the matching `*.read` permission.
For example, `finance` never gets customer or ticket hits.

### 3.2 Frontend page visibility (`NAV_VISIBILITY`)

| Page | super_admin | manager | support_agent | finance |
|---|:-:|:-:|:-:|:-:|
| `/dashboard` | ✅ | ✅ | ✅ | ✅ |
| `/bookings`, `/bookings/:id` | ✅ | ✅ | ✅ | ✅ |
| `/support` | ✅ | ✅ | ✅ | ❌ |
| `/refunds` | ✅ | ✅ | ✅ | ✅ |
| `/providers` | ✅ | ✅ | ❌ | ❌ |
| `/customers` | ✅ | ✅ | ❌ | ❌ |
| `/settings` | ✅ | ❌ | ❌ | ❌ |

- `AppLayout` re-checks `canViewPath()` on every route. A hidden page reached by URL renders `ForbiddenPage`.
- UI action gates (`can()`):
  - `refund.approve` controls the Approve/Reject buttons
  - `booking.reassign` controls Reassign/Cancel on the booking detail page
  - `team.manage` controls the team row menu
- Ungated in the UI on purpose: ticket reply, resolve and escalate, and refund request.

### 3.3 Seeded staff accounts

All seeded accounts share the password **`Demo@1234`**. `POST /auth/demo-login` signs in as the
first active user with the requested role.

| Name | Email | Role |
|---|---|---|
| Ammar Khan | ammar.khan@servihub.com | super_admin |
| Brianna Lopez | brianna.lopez@servihub.com | manager |
| Derek Simmons | derek.simmons@servihub.com | manager |
| Madison Carter | madison.carter@servihub.com | support_agent |
| Tyler Brooks | tyler.brooks@servihub.com | support_agent |
| Jessica Nguyen | jessica.nguyen@servihub.com | finance |

Seed totals: 6 users, 12 providers, 18 customers, 55 bookings, 14 tickets, 7 refunds.
Booking and ticket dates fall in June–July 2026.

---

## 4. API routes

**Request conventions**

- Base URL in dev: `http://localhost:5000/api`. Bodies are JSON.
- Auth uses **httpOnly cookies**, not bearer tokens: `accessToken` (path `/`) and `refreshToken`
  (path `/api/auth/refresh`). Clients must send credentials.
- Every `:id` is a Mongo ObjectId, validated by zod. Human codes (`BK-4801`, `TK-101`, `RF-31`)
  are display-only.

**Response conventions**

- List responses have the shape `{ items, total, page, pages }`. Query params `page` (default 1)
  and `limit` (default 20, max 50).
- Error responses have the shape `{ message, code?, errors? }`.
  - `code` is `TOKEN_EXPIRED` or `ACCOUNT_DISABLED`.
  - `errors` is a field→message map, present only on validation 400s.
  - A `stack` field is added outside production.

### 4.1 Auth — `/api/auth`

| Method | Path | Guard | Notes |
|---|---|---|---|
| POST | `/login` | public, `authLimiter` | `{ email, password }` → `{ user }` and sets cookies. Same generic 401 for an unknown email or a wrong password; 403 if the account is disabled |
| POST | `/google` | public, `authLimiter` | `{ credential }` (Google ID token). Logs in an existing user only and never creates one; 404 if no account exists |
| POST | `/demo-login` | public, `authLimiter` | `{ role }` → signs in as that role **without a password** |
| POST | `/refresh` | public (refresh cookie) | Checks the signature, `tokenVersion` and `status`, then issues new cookies |
| POST | `/logout` | public | Clears both cookies |
| GET | `/me` | `requireAuth` | `{ user: { id, name, email, role, status } }` |

### 4.2 Team — `/api/team` (all routes: `requireAuth` + `team.manage`)

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/` | — | `{ members }`, full roster, no pagination |
| PATCH | `/:id/role` | `{ role }` | Bumps `tokenVersion` and invalidates the auth cache. 400 if `:id` is your own account |
| PATCH | `/:id/status` | `{ status: active\|disabled }` | Same side effects and self-check as the role route |

### 4.3 Dashboard — `/api/dashboard`

| Method | Path | Guard | Response |
|---|---|---|---|
| GET | `/summary` | `dashboard.read` | `{ kpis, last14Days, statusBreakdown, recentBookings, openTickets }` |

### 4.4 Bookings — `/api/bookings`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `booking.read` | Query: `status`, `service`, `search` (code or customer name), `sortBy` (`scheduledAt`\|`amount`), `sortDir` |
| GET | `/:id` | `booking.read` | Customer and provider populated |
| PATCH | `/:id/reassign` | `booking.reassign` | `{ providerId }`. 409 if the provider is unavailable. Appends a timeline event |
| PATCH | `/:id/cancel` | `booking.reassign` | Only `pending` or `assigned` bookings; otherwise 409 |

### 4.5 Providers — `/api/providers`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `provider.read` | Query: `service`, `availableOnly` (`"true"`\|`"false"`), `search` (name) |
| GET | `/:id` | `provider.read` | `{ provider, earnings, jobs, recentBookings }`. Earnings and jobs are computed from completed bookings |

### 4.6 Customers — `/api/customers`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `customer.read` | Query: `search` (name or phone). Each item gets computed `totalBookings`, `totalSpent`, `lastBookingAt` |
| GET | `/:id` | `customer.read` | `{ customer, bookings, tickets }`, each list capped at 50 |

### 4.7 Refunds — `/api/refunds`

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `refund.read` | Query: `status`. Also returns `counts: { pending, approved, rejected }` |
| GET | `/:id` | `refund.read` | Booking (with customer), `requestedBy` and `decidedBy` populated |
| POST | `/` | `refund.request` | `{ bookingId, amount, reason }`. 400 if amount exceeds the booking; 409 if a pending refund already exists for the booking |
| PATCH | `/:id/decision` | `refund.approve` | `{ decision: approved\|rejected }`. 409 if the refund is not pending |

### 4.8 Tickets — `/api/tickets`

**Public routes.** These back `/simulator` and are guarded only by `ticketSimulatorLimiter`:

| Method | Path | Notes |
|---|---|---|
| POST | `/` | `{ customerId, bookingId, subject, text, priority }` creates a ticket and emits `ticket:new` to the `agents` room |
| GET | `/simulator/options` | `{ customers: [{ id, name, bookings, openTickets }] }` (up to 50 customers) |
| GET | `/simulator/:id` | Code, subject, status, priority and **all messages** of any ticket |
| POST | `/:id/customer-message` | `{ text }` appends a customer message and emits `ticket:message` |

**Staff routes.** All require `requireAuth`:

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/` | `ticket.read` | Query: `status`, `priority`. Each item gets computed `unanswered` and `hasAnalysis` |
| GET | `/:id` | `ticket.read` | Booking (with provider) and customer populated; includes the stored `aiAnalysis` |
| POST | `/:id/messages` | `ticket.reply` | `{ text }` (1–2000 chars); emits `ticket:message` |
| PATCH | `/:id/status` | `ticket.resolve` | `{ status: open\|in_progress\|resolved }` |
| PATCH | `/:id/priority` | `ticket.resolve` | `{ priority: low\|medium\|high }` |
| POST | `/:id/analyze` | `ticket.read` + `aiAnalysisLimiter` | Calls Groq and validates the output with zod, retrying once. Saves `aiAnalysis`. Returns 502 after two bad responses |

### 4.9 Search and health

| Method | Path | Guard | Notes |
|---|---|---|---|
| GET | `/api/search` | `requireAuth` | `?q=` (max 100 chars) → `{ bookings, customers, tickets }`. Anchored prefix match, 5 hits per type, role-filtered |
| GET | `/api/health` | public | `{ status: "ok", uptime }` |

### 4.10 Rate limiters

All limiters use an in-memory store, so they reset on restart.

| Limiter | Key | Limit | Applied to |
|---|---|---|---|
| `apiLimiter` | IP | 300 / 15 min | every route |
| `authLimiter` | IP | 10 / 15 min | `/auth/login`, `/auth/google`, `/auth/demo-login` |
| `ticketSimulatorLimiter` | IP | 20 / 15 min | the 4 public ticket routes |
| `aiAnalysisLimiter` | user id | 10 / min | `POST /tickets/:id/analyze` |

### 4.11 Socket.IO events

The server is the same HTTP server as the API. Connection auth works as follows:

- **Staff sockets** authenticate with the `accessToken` cookie and auto-join the `agents` room.
- **Simulator sockets** send handshake `auth: { role: "simulator" }`, with no other check.

| Direction | Event | Payload | Notes |
|---|---|---|---|
| client → server | `ticket:join` / `ticket:leave` | `ticketId` | Joins or leaves room `ticket:{id}` (any socket, any id) |
| client → server | `typing` | `{ ticketId }` | Server sets `from` (`agent` or `customer`) based on the socket type |
| client → server | `customer:message` | `{ ticketId, text }` + ack | Simulator sockets only; same write path as the REST route |
| server → client | `ticket:new` | ticket | Sent to the `agents` room |
| server → client | `ticket:message` | `{ ticketId, message }` | Sent to `ticket:{id}`, sender included (the client dedups) |
| server → client | `typing` | `{ ticketId, from }` | Sent to `ticket:{id}`, sender excluded |

### 4.12 Frontend routes

| Path | Page | Auth |
|---|---|---|
| `/login` | Login (email/password, Google button, demo access) | redirects to `/dashboard` if signed in |
| `/forgot-password` | Forgot-password form (stub) | same as above |
| `/` | redirect to `/dashboard` | signed in |
| `/dashboard`, `/bookings`, `/bookings/:id`, `/providers`, `/customers`, `/support`, `/refunds`, `/settings` | main app inside `AppLayout` | signed in + `canViewPath` |
| `/simulator` | customer simulator | none (rendered before the auth boot check) |

---

## 5. Environment variables (names only)

### `servihub-api/.env`

All variables below are validated at boot by [`src/config/env.js`](servihub-api/src/config/env.js).
The process exits if any are missing or invalid.

| Name | Required | Purpose |
|---|---|---|
| `NODE_ENV` | no (default `development`) | `development` \| `test` \| `production`. Production turns on `secure` cookies and hides stack traces |
| `PORT` | no (default `5000`) | HTTP and Socket.IO port |
| `MONGODB_URI` | yes | MongoDB connection string |
| `CLIENT_URL` | yes, must be a URL | The only allowed CORS origin, for REST and Socket.IO |
| `JWT_ACCESS_SECRET` | yes, ≥ 32 chars | Signs access tokens |
| `JWT_REFRESH_SECRET` | yes, ≥ 32 chars | Signs refresh tokens |
| `GROQ_API_KEY` | yes | AI Copilot |
| `GOOGLE_CLIENT_ID` | yes | Audience check for Google ID tokens |
| `ACCESS_TOKEN_TTL` | no (default `15m`) | Dev override for the access-token lifetime, e.g. `30s` |

The local `.env` also contains names that **no code reads**:

- `RESEND_API_KEY` and `RESET_PASSWORD_URL_BASE`, which look planned for forgot-password
- `VITE_GOOGLE_CLIENT_ID`, a frontend variable in the backend file

`GOOGLE_CLIENT_ID` is also listed twice.

### `Servicehub-admin/.env`

These are Vite variables, baked in at build time.

| Name | Required | Purpose |
|---|---|---|
| `VITE_API_URL` | yes | API base **including `/api`**. Its origin is also used as the Socket.IO URL |
| `VITE_GOOGLE_CLIENT_ID` | for the Google button | Must match the backend `GOOGLE_CLIENT_ID` |

Neither app has a `.env.example`.

---

## 6. Data model (MongoDB)

All models use `timestamps: true` and `versionKey: false`.

| Model | Key fields |
|---|---|
| **User** | `name`, `email` (unique, lowercased), `passwordHash`, `role`, `status` (`active`\|`disabled`), `tokenVersion`. `toJSON` strips `passwordHash` and `tokenVersion` |
| **Provider** | `name`, `phone`, `services[]`, `rating`, `jobsCompleted`, `isAvailable`, `verified`, `area`, `joinedAt` |
| **Customer** | `name`, `phone`, `area`, `joinedAt`. Totals are computed per request, never stored |
| **Booking** | `code` (`BK-####`), `customer`, `provider?`, `service`, `status` (`pending`\|`assigned`\|`in_progress`\|`completed`\|`cancelled`), `scheduledAt`, `amount`, `address`, `timeline[{ event, at }]` |
| **Ticket** | `code` (`TK-###`), `booking`, `customer`, `subject`, `priority` (`low`\|`medium`\|`high`), `status` (`open`\|`in_progress`\|`resolved`), `messages[{ from: customer\|agent, senderName, text, at }]`, `aiAnalysis?` |
| **Refund** | `code` (`RF-##`), `booking`, `amount`, `reason`, `status` (`pending`\|`approved`\|`rejected`), `requestedBy`, `decidedBy`, `decidedAt` |

The `aiAnalysis` object has these fields:

- `summary`
- `sentiment` (`calm`\|`neutral`\|`frustrated`\|`angry`)
- `refundEligibility { eligible, percent, reason }`
- `suggestedReply`
- `suggestedActions[]` (1–3 of `request_refund`\|`reassign_provider`\|`escalate`\|`no_action`)
- `analyzedAt`

**Refund policy**: [`src/config/refundPolicy.js`](servihub-api/src/config/refundPolicy.js) defines six numbered sections. The AI must cite them.

| Section | Rule |
|---|---|
| §1 | Cancellations |
| §2 | Provider no-show → 100% |
| §3 | Provider delay over 90 min → 50% |
| §4 | Incomplete work → up to 70% |
| §5 | Customer-fault cancellation → 0% |
| §6 | 7-day request window |

---

## 7. Features — complete

### Auth and session

- Email/password login.
- Google sign-in for existing users only.
- Demo-access buttons for each role.
- Silent token refresh in `lib/api.js`, with a single in-flight refresh shared by concurrent 401s. See the caveat in §10.3 #1.
- Session restore on page load via `GET /auth/me`.
- Logout.
- Disabling a user or changing their role takes effect immediately: `invalidateAuthCache` plus a `tokenVersion` bump.

### RBAC

- Backend permission map on every route.
- Frontend nav filtering.
- Route-level `ForbiddenPage` for pages reached by URL.
- `npm run audit:rbac` verifies the matrix.

### Dashboard

- 4 KPI cards with deltas.
- 14-day bookings bar chart.
- Bookings-by-status bars.
- Recent bookings and open tickets lists.

### Bookings

- Server-side search, status and service filters, sort and pagination.
- Detail page with timeline, customer, provider and payment cards.
- Reassign provider and cancel booking, gated by `booking.reassign`.

### Providers and Customers

- Searchable, filterable directories.
- Row click opens a drawer with computed stats, recent jobs, booking history and complaint history.

### Support Center

- 3-pane workspace: queue tabs, conversation, Copilot panel.
- Agent replies, Mark resolved, and Escalate (sets priority to high).
- Unanswered dot and "AI analyzed" icon in the queue.
- Responsive: the queue and Copilot move into drawers below 800px and 1100px.

### Real-time

- New tickets update the queue and the topbar bell dot live.
- Messages arrive live, with typing indicators in both directions.

### AI Copilot

- Analyze and re-analyze; the result is stored on the ticket.
- Shows summary, sentiment, refund eligibility and the suggested reply.
- "Insert into composer" copies the suggested reply into the message box.
- Dynamic action buttons:
  - Request refund opens a dialog prefilled from the AI's percent and reason.
  - Reassign provider opens the reassign dialog.
  - Escalate raises the priority.

### Refunds

- Pending/Approved/Rejected tabs with counts.
- Detail drawer with approve/reject behind a confirm dialog.
- Highlight pulse on a row after its decision.

### Settings → Team

- Roster table.
- Change role.
- Enable or disable a member.
- You cannot act on your own account.

### Customer simulator

- Pick a customer.
- Continue an open ticket or start a new one on one of their bookings.
- Live chat with typing indicator.

### Global search

- Cmd/Ctrl+K, debounced, arrow-key navigation.
- Searches bookings, customers and tickets.

### Cross-cutting UI

- Light/dark theme with no flash on load.
- Skeleton, empty and error states with Retry on every list and drawer.
- Debounced search inputs.
- Per-page document titles.
- Responsive tables.

### Backend hardening

- helmet and a CORS allow-list.
- zod validation on all inputs.
- NoSQL operator sanitizing.
- Regex-escaped search.
- 4 rate limiters.
- Generic AI error messages.
- No stack traces in production.

### Tooling

- `npm run seed`, `npm run audit:rbac`, `npm run e2e`.

---

## 8. Features — incomplete or stubbed

| Feature | State | Where |
|---|---|---|
| Forgot password | Form submits nothing (`// TODO: wired in Prompt 3`). No backend route. Resend env vars exist but are unused | [`ForgotPasswordPage.jsx:16`](Servicehub-admin/src/pages/forgotPassword/ForgotPasswordPage.jsx#L16) |
| Add team member | Button permanently disabled. No `POST /team` route, so staff can only be created by the seed | [`SettingsPage.jsx`](Servicehub-admin/src/pages/settings/SettingsPage.jsx) |
| "Keep me logged in" | Checkbox state is never used | [`LoginPage.jsx`](Servicehub-admin/src/pages/login/LoginPage.jsx) |
| Topbar "This Week" button | No handler; the dashboard always uses fixed windows | [`Topbar.jsx`](Servicehub-admin/src/layouts/Topbar.jsx) |
| Notification bell | Shows a dot only; clicking does nothing | [`Topbar.jsx`](Servicehub-admin/src/layouts/Topbar.jsx) |
| Ticket `in_progress` / reopen | The API supports any status, but the UI only offers "Mark resolved" | [`ConversationPanel.jsx`](Servicehub-admin/src/pages/support/ConversationPanel.jsx) |
| Deep links | Customer and ticket search results, the booking page's customer "View" link, and the customer drawer's complaint links all go to the list page, not the specific record | `SidebarSearch.jsx`, `BookingCustomerCard.jsx`, `CustomerDrawer.jsx` |
| Refund request outside Copilot | The Refunds page has no "New refund" action; requests can only start from a Copilot suggestion | [`RefundsPage.jsx`](Servicehub-admin/src/pages/refunds/RefundsPage.jsx) |
| Create/edit bookings, providers, customers | Not implemented; those modules are read-only apart from reassign/cancel | — |
| Password change / "log out everywhere" | Mentioned in SECURITY.md as `tokenVersion` triggers, but no endpoint exists | — |
| Automated tests, lint, CI, `.env.example` | None | — |

---

## 9. Running locally

```bash
# backend
cd servihub-api
npm install
npm run seed          # wipes and reseeds MongoDB
npm run dev           # nodemon, http://localhost:5000

# frontend (separate terminal)
cd Servicehub-admin
npm install
npm run dev           # Vite dev server; its origin must equal CLIENT_URL

# with the API running:
npm run audit:rbac    # in servihub-api, read-only permission matrix check
npm run e2e           # in servihub-api, writes data + calls Groq; re-seed afterwards
```

---

## 10. Known TODOs and issues

### 10.1 Explicit TODOs in code

There is only one:

- [`Servicehub-admin/src/pages/forgotPassword/ForgotPasswordPage.jsx:16`](Servicehub-admin/src/pages/forgotPassword/ForgotPasswordPage.jsx#L16) — `// TODO: wired in Prompt 3`.

### 10.2 Accepted limitations (documented in SECURITY.md)

- **Single-instance state.** The auth cache and the rate-limit store live in process memory. A multi-instance deployment needs Redis.
- **No CSRF token.** The app relies on `sameSite=lax` cookies plus strict CORS.
- **No account lockout.** Only IP-based rate limiting on login.

### 10.3 Bugs and gaps found in this scan

Ordered roughly by impact. None of these have been fixed.

1. **Silent refresh likely never fires in a real browser at the default TTL.**
   - The `accessToken` cookie `maxAge` is hardcoded to 15 min ([`utils/cookies.js:3`](servihub-api/src/utils/cookies.js#L3)), the same as the default JWT TTL. The browser drops the cookie at about the moment the token expires.
   - With no cookie, `requireAuth` returns 401 **without** `code: "TOKEN_EXPIRED"` ([`middleware/auth.js:56`](servihub-api/src/middleware/auth.js#L56)).
   - [`lib/api.js:26`](Servicehub-admin/src/lib/api.js#L26) only refreshes on that code, so requests start failing after about 15 minutes.
   - A short dev `ACCESS_TOKEN_TTL` such as `30s` hides the problem.
2. **`POST /auth/demo-login` gives anyone a `super_admin` session without a password** ([`auth.controller.js:80`](servihub-api/src/controllers/auth.controller.js#L80)). This is intentional for the demo. It should sit behind an env flag before any real deployment.
3. **Refresh tokens are not actually rotated or revoked.**
   - `refresh` re-signs the token with the same `tokenVersion` ([`auth.controller.js:92`](servihub-api/src/controllers/auth.controller.js#L92)), so the old refresh token stays valid for its full 7 days.
   - `logout` ([line 114](servihub-api/src/controllers/auth.controller.js#L114)) only clears cookies.
   - SECURITY.md's claim that "whichever party refreshes first invalidates the other" is therefore not true.
4. **Simulator surface is fully public.**
   - Anyone can list every customer and their open tickets.
   - Anyone can read any ticket's full conversation (`GET /tickets/simulator/:id`).
   - Anyone can post as any customer.
   - Anyone can open a socket with `auth: { role: "simulator" }`, join any `ticket:{id}` room and receive agent replies live.
   - This is by design for the demo, but it is a data-exposure risk outside one.
5. **Staff socket auth trusts the JWT only** ([`sockets/index.js:102`](servihub-api/src/sockets/index.js#L102)).
   - It never checks `status` or `role` against the DB, unlike `requireAuth`.
   - A disabled user's open socket keeps receiving events until it disconnects.
6. **Refunds can exceed the booking amount.** `createRefund` only blocks a duplicate *pending* refund ([`refund.controller.js:67`](servihub-api/src/controllers/refund.controller.js#L67)). After one refund is approved, another for the full amount can be filed and approved.
7. **Reassign has no backend business rules** ([`booking.controller.js:70`](servihub-api/src/controllers/booking.controller.js#L70)).
   - It does not check that the provider offers the booking's service.
   - It does not check booking status, so cancelled or completed bookings can be reassigned. The UI also shows "Reassign provider" on cancelled bookings.
   - A `pending` booking stays `pending` after a provider is assigned.
8. **Copilot shows "Reassign provider" to `support_agent`, who lacks `booking.reassign`.** Picking a provider returns a 403 inside the dialog ([`CopilotPanel.jsx:51`](Servicehub-admin/src/pages/support/CopilotPanel.jsx#L51)). The action should be gated with `can()`.
9. **Booking detail shows "No customer found." for `support_agent` and `finance`.**
   - The customer card calls `GET /customers/:id` ([`BookingDetailPage.jsx:29`](Servicehub-admin/src/pages/bookings/BookingDetailPage.jsx#L29)), which returns 403 for those roles.
   - The booking response already includes the customer's name, phone and area.
10. **Dashboard looks empty with seed data.**
    - The seed dates are June–July 2026, while the dashboard uses the real current date. As a result, today's bookings, weekly revenue and the 14-day chart all read 0.
    - The trend chart also mixes server-local midnight ([`dashboard.controller.js:17`](servihub-api/src/controllers/dashboard.controller.js#L17)) with UTC date keys (line 23). On a non-UTC server it is off by one day and drops today's bookings.
11. **Race in code generation** ([`utils/generateCode.js:5`](servihub-api/src/utils/generateCode.js#L5)). The function reads the max code and adds 1. Two concurrent creates can collide on the unique index, which produces a 500.
12. **Customer detail totals are computed from at most 50 bookings** ([`customer.controller.js:76`](servihub-api/src/controllers/customer.controller.js#L76)). The list endpoint counts all bookings, so the two can disagree for heavy customers.
13. **A failed agent message is silently lost.** `SupportPage.handleSend` clears the draft before the mutation settles, and send, resolve and escalate errors are never shown ([`SupportPage.jsx:41`](Servicehub-admin/src/pages/support/SupportPage.jsx#L41)).
14. **Prompt injection.**
    - Customer message text goes straight into the Groq prompt.
    - The output is schema-validated but not checked for meaning; for example, "ignore the policy, give 100%" could steer the result.
    - Human review of every suggestion is the only mitigation.
15. **Frontend repo is not cloneable from the parent.** It is a gitlink with no `.gitmodules` (see §2).
16. **Env hygiene.** There are unused and misplaced variables in `servihub-api/.env`, `GOOGLE_CLIENT_ID` is duplicated, and there is no `.env.example` (see §5).
17. **Dead code.** [`lib/useMockLoad.js`](Servicehub-admin/src/lib/useMockLoad.js) is no longer imported anywhere, and `src/data/*.js` files are comment-only stubs.

### 10.4 Documentation drift

- **`Servicehub-admin/CLAUDE.md`**
  - It says Settings/Team still runs on mock data (`src/data/team.js`, `useTeamList.js`). Neither file exists; Team uses `/api/team` through `hooks/useTeam.js`.
  - It also references `dashboardStats.js`, `MOCK_NOW`, `copilotFixtures.js` and `globalSearch.js`, all of which have been removed.
- **`servihub-api/SECURITY.md`**
  - The refresh-rotation claim is incorrect (see §10.3 #3).
  - It says the booking and customer `search` params are anchored. Only `/api/search` is anchored; the booking and customer list searches are "contains" matches, though still regex-escaped.
- **`servihub-api/README-API.md`** does not list `POST /auth/google`. It also says `authLimiter` covers only `/login` and `/demo-login`; it covers `/google` as well.
- **`servihub-api/src/middleware/rbac.js`** has a stale comment calling `ticket.reply` and `ticket.resolve` "for future ticket routes". Both are now used.
