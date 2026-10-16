# ServiHub Admin — Design System & Engineering Constitution

ServiHub Admin is the internal admin panel for a home-services marketplace
(cleaning, AC repair, plumbing, electrical, pest control, maid service). It
is a React 19 + Vite app talking to `../servihub-api` over REST (axios +
TanStack Query) and Socket.IO. This document is binding for every future
session. Follow it exactly; do not improvise new tokens, colors, or patterns.

## Design Tokens

All tokens are defined as CSS custom properties in `src/index.css` (`:root`
for light mode, `.dark` for dark mode) and re-exposed to Tailwind v4 via the
`@theme` block, so they're usable as ordinary utility classes.

### Colors

| Token | Light | Dark | Tailwind utility |
|---|---|---|---|
| canvas | `#F7F7F8` | `#0B0B0D` | `bg-canvas` / `text-canvas` |
| surface | `#FFFFFF` | `#141417` | `bg-surface` |
| border | `#E4E4E7` | `#26262B` | `border-border` |
| text-primary | `#18181B` | `#F4F4F5` | `text-text-primary` |
| text-secondary | `#71717A` | `#A1A1AA` | `text-text-secondary` |
| accent | `#2563EB` | `#3B82F6` | `bg-accent` / `text-accent` |

Status colors are identical in both modes and intentionally muted, never
neon:

| Token | Value | Utility |
|---|---|---|
| success | `#16A34A` | `text-success` / `bg-success` |
| warning | `#D97706` | `text-warning` / `bg-warning` |
| danger | `#DC2626` | `text-danger` / `bg-danger` |
| info | `#0891B2` | `text-info` / `bg-info` |

Dark mode is toggled by adding/removing the `.dark` class on `<html>` (see
Theme System). Never hardcode hex colors in components — always use the
token utility classes above.

### Radius

- `rounded-card` → 8px. Use for cards and inputs.
- `rounded-btn` → 6px. Use for buttons and badges.
- Never use any other radius value anywhere in the app.

### Shadows

- `shadow-card` → light mode: `0 1px 2px rgb(0 0 0 / 0.04)`. Dark mode:
  `none` — depth in dark mode comes only from surface color steps and
  borders, never shadows.

## Typography

- UI text font: **Inter** (`@fontsource-variable/inter`, the default body
  font). Body and table text: 13–14px. Section labels: 15px max.
- **Every data value** — IDs, amounts, dates, times, counts, percentages —
  renders in **JetBrains Mono** via the `.font-data` utility class. Hard rule,
  no exceptions. All formatting goes through `src/lib/formatters.js`.
- Page titles: 20px / weight 600 (`text-[20px] font-semibold`). No text
  anywhere in the app may exceed 24px.

## Component Grammar

- **Status indicators**: never a filled pill badge. Always a small 6px
  colored dot + an uppercase JetBrains Mono label, e.g. `● IN PROGRESS`.
  `<StatusBadge status="..."/>` is the only status UI in the app (bookings,
  refunds, tickets, priorities, provider availability, sentiment, team
  member status). Pass the raw API value (`in_progress`); the badge turns
  underscores into spaces. Add new status strings to its `STATUS_TONE` map;
  unknown statuses fall back to the `info` tone.
- **Enum values in text**: never print a raw API value such as
  `support_agent` or `in_progress`. Use `roleLabel()` (Settings) or
  `humanize()` from `lib/formatters.js`.
- **Tables**: compact density. Row height 44px, 13px body text, one line per
  row (cells don't wrap — narrow screens scroll the table sideways). Header
  row is 11px uppercase `text-text-secondary` with letter-spacing.
- **Buttons**: three variants only — primary (accent background), secondary
  (surface background + border), ghost (no background/border until hover).
  Height 34px. No gradients, ever. For a destructive action use
  `tone="danger"` on `<Button>`, never a `text-danger` className override
  (Tailwind resolves conflicting utilities by registration order, not by
  which one you wrote last). Missing variant/tone combinations go into
  `Button.jsx`'s `VARIANT_TONE_CLASSES` map.
- **Cards**: `bg-surface`, 1px `border-border`, `rounded-card`, 20px padding.
- **Feedback**: inline errors next to the field or in the dialog that
  caused them (`<FormField error>` or a `role="alert"` paragraph). Toasts
  (`useToast()`) only for actions with no natural inline place to report
  (row menus, header quick actions, background successes).

## Hard Rules (never violate)

- No gradients. No purple/violet anywhere in the palette. No emoji in the
  UI. No oversized hero-style padding — this is a dense professional tool in
  the spirit of Linear/Stripe, not a marketing site.
- Every list/table screen ships with a designed empty state, a skeleton
  loading state and an error state with Retry (`<QueryError onRetry>`).
- Every interactive element has a visible keyboard focus state. The global
  `:focus-visible` outline in `src/index.css` covers most cases — don't
  suppress it with `outline-none` unless you replace it with an equally
  visible alternative.
- Respect `prefers-reduced-motion` (handled globally in `src/index.css`);
  don't add animations that ignore it.
- Don't invent new colors, radii, shadows, or font sizes. If a screen seems
  to need one, reuse an existing token.

## Architecture Rules

- **JavaScript only** — no TypeScript. Functional components + hooks only.
- Folder structure (all under `src/`):
  ```
  components/ui/   Reusable, feature-agnostic primitives (see table below).
  components/      Feature components shared by several pages (dashboard
                   cards, refunds/RequestRefundDialog).
  context/         AuthContext, SocketContext, NotificationContext,
                   ToastContext, ThemeContext.
  hooks/           TanStack Query hooks, one file per API resource, plus
                   useTicketSocket. Components never call lib/api.js
                   directly - they go through these hooks.
  layouts/         AppLayout (sidebar + topbar + permission check),
                   Sidebar, Topbar, SidebarSearch (Cmd/Ctrl+K),
                   NotificationsMenu, RangePicker, UserMenu,
                   RealtimeBridge, AuthLayout.
  lib/             api.js (axios + silent refresh), socket.js,
                   permissions.js, formatters.js, small hooks
                   (useDebouncedValue, useDismiss, useMediaQuery,
                   useQueryParamState, useDocumentTitle).
  pages/           One folder per screen. Pages compose components; they
                   don't define new visual primitives inline.
  test/            Vitest setup, render helper, mock API.
  ```
- Keep components small and readable. Prefer clarity over cleverness.
- All currency, date, time, relative-time and name formatting goes through
  `src/lib/formatters.js` (`formatUSD`, `formatDate`, `formatDateTime`,
  `formatTime`, `relativeTime`, `formatNumber`, `formatPercent`,
  `initials`, `humanize`, ...). Never call `Intl` inline in a component.

## Theme System

- `src/context/ThemeContext.jsx` provides `{ theme, setTheme, toggleTheme }`
  via `useTheme()`. Theme is `"light" | "dark"`.
- Default: system preference, unless the user chose a theme
  (`localStorage["servihub-theme"]`).
- An inline script in `index.html` sets the `.dark` class before React
  hydrates, so there is no flash of the wrong theme.
- Never read/write theme state except through `useTheme()`.

## Auth, sessions & permissions

- **Sessions live in httpOnly cookies set by the API**; this app never sees
  or stores a token. `AuthContext` restores the session with
  `GET /auth/me` on load (`isLoading` until it resolves; `App.jsx` shows
  `<FullPageLoader/>` meanwhile) and exposes `user`, `login(email, password,
  remember)`, `googleLogin`, `demoLogin`, `logout`, `logoutEverywhere`,
  `updateUser` and `sessionNotice`.
- **Silent refresh** lives in `lib/api.js`: a 401 with `TOKEN_EXPIRED`,
  `AUTH_REQUIRED` or `INVALID_TOKEN` triggers one shared `POST /auth/refresh`
  (concurrent failures await the same promise) and a single retry.
  `SESSION_REVOKED` / `ACCOUNT_DISABLED`, or a failed refresh, end the
  session locally: cached data is dropped and the sign-in page shows a
  notice explaining why. Use `errorMessage(error)` and `fieldErrors(error)`
  from `lib/api.js` to display API errors.
- **Permissions come from the API.** `user.permissions` (generated from
  `servihub-api/src/middleware/rbac.js`) is the only copy of the role
  matrix. `lib/permissions.js` exports `can(user, permission)` and
  `canViewPath(user, path)` (`PAGE_PERMISSIONS` maps each page to the
  permission it needs). Never compare roles inline — check a permission.
  This is UI visibility only; the API enforces every rule itself.
- `<RequireAuth>` / `<RedirectIfAuthed>` decide whether a route is reachable
  at all and remember the target of a signed-out deep link. `AppLayout`
  checks `canViewPath` for the current path and renders `<ForbiddenPage/>`
  for pages the role can't open; unknown paths render `<NotFoundPage/>`.
- The demo-access buttons and the Google button on `/login` appear only
  when `GET /api/config` says demo mode / Google sign-in are enabled.

## Data fetching

- Query keys are structured arrays so prefix invalidation works:
  `["bookings", params]` / `["bookings", id]`, `["refunds", "list", params]`
  / `["refunds", "detail", id]`, `["tickets", "queue", status]` /
  `["tickets", "list", params]` / `["tickets", "detail", id]`,
  `["dashboard", "summary", range, tz]`, `["config"]`.
- Mutations that return a full record (bookings, tickets, refunds) write it
  straight into the detail cache (`setQueryData`) and invalidate the
  related lists; the API returns mutation responses in exactly the GET
  detail shape for this reason.
- Search inputs are debounced 300ms (`useDebouncedValue`). Pickers use
  `<SearchSelect useOptions={...}>` with the hooks in `usePickerOptions.js`.
- Drawers and the selected support ticket are deep-linkable through query
  parameters (`?customer=`, `?provider=`, `?refund=`, `?ticket=`) via
  `useQueryParamState`; global search and notifications link to them.
- Defaults (`main.jsx`): `staleTime` 30s, no refetch on window focus, no
  retry on 4xx, one retry on network/5xx errors.

## Realtime

- `SocketContext` owns one staff socket per signed-in user (cookies,
  `withCredentials`); `lib/socket.js#createStaffSocket` refreshes the
  session and reconnects when a handshake is refused with an expired
  token, and ends the session locally when it is refused as revoked or
  disabled.
- `layouts/RealtimeBridge.jsx` (mounted once in `AppLayout`) keeps cached
  lists fresh on `ticket:new`, `ticket:customer-message`, `ticket:updated`,
  `refund:requested` and `refund:decided`, and turns the noteworthy ones
  into bell notifications (`NotificationContext`, kept per user in
  localStorage, max 30).
- `hooks/useTicketSocket.js` handles the open conversation: joining the
  ticket room, appending `ticket:message` into the cache (deduplicated —
  the sender receives its own message back), and the 2s typing indicator.
- `/simulator` is a separate, deliberately plain test-harness page (no
  `components/ui`, no tokens, dashed "test harness" banner). It uses its own
  socket from `createSimulatorSocket()` and per-ticket tokens from the API,
  and exists only when the API runs in DEMO_MODE.
- StrictMode gotcha: socket.io-client doesn't auto-reconnect a socket you
  disconnected yourself. Sockets are created with `autoConnect: false` and
  connected in the effect that also disconnects them, so StrictMode's
  mount → cleanup → mount cycle leaves them connected.

## `components/ui/` primitives

Check this list before adding a primitive.

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant="primary"\|"secondary"\|"ghost"` (default secondary), `tone="default"\|"danger"`, `className`, `...props` | 34px; colors from `VARIANT_TONE_CLASSES`. Defaults to `type="button"`. |
| `Card` | `padded=true`, `className` | Set `padded={false}` around a `DataTable`. |
| `StatusBadge` | `status` | The only status UI (see Component Grammar). |
| `Skeleton` | `className` | One `animate-pulse` block. |
| `Toolbar` | `className` | `flex flex-wrap items-center gap-3` filter bar. |
| `DetailField` | `label`, `mono=false` | Label/value row for drawers and info cards. |
| `Drawer` | `open`, `onClose`, `title` or `ariaLabel`, `widthClassName="max-w-md"`, `side="left"\|"right"`, `padded=true` | Stays mounted through its close transition — clear the `open` flag, not the selected record. Escape closes it. |
| `ConfirmDialog` | `open`, `onClose`, `title`, `description`, `footer`, `onSubmit`, `widthClassName` | Centered modal; with `onSubmit` the body is a `<form>` (Enter submits). **Render it as a sibling of a `Drawer`, never inside one** — the drawer's transform would become the containing block for the fixed overlay. |
| `DataTable` | `columns` (`{ key, label, align, sortable, render }`), `data`, `getRowKey`, `getRowClassName`, `onRowClick`, `sortKey`, `sortDirection`, `onSortChange`, `isLoading`, `emptyState`, `skeletonRowCount=8` | 44px one-line rows; `min-w-[720px]` inside `overflow-x-auto`. |
| `Pagination` | `page`, `pageSize`, `total`, `totalPages`, `onPageChange`, `label` | "1–12 of 55" + Prev/Next. |
| `FormField` | `label`, `hint`, `error`, `className` | Wires the label, hint and error to the single control inside it. |
| `Input` / `Select` / `Textarea` / `Checkbox` | native props (`Checkbox` adds `label`) | Token-styled native controls. |
| `SearchSelect` | `value`, `onChange`, `useOptions(query)`, `getKey`, `renderOption`, `renderValue`, `placeholder`, `emptyText` | Accessible combobox for picking a record from the API. |
| `QueryError` | `message`, `onRetry`, `className` | Icon + message + ghost Retry. |
| `Avatar` | `name`, `size=28` | Initials on an accent-tinted circle. |
| `Logo` | `size=28` | Same mark as `public/favicon.svg`. |

Micro-interactions live in `index.css` and are limited to four:
`animate-page-enter` (route change), `animate-dialog-enter` /
`animate-overlay-enter` (dialogs, drawers, toasts) and
`animate-highlight-pulse` ("this row just changed").

## Testing

- `npm test` runs Vitest with jsdom and Testing Library (`src/**/*.test.jsx?`).
- `src/test/render.jsx` renders with every provider; `src/test/mockApi.js`
  stubs the axios instance per test. Prefer testing behaviour a user would
  notice (what is shown, what is offered to which role) over implementation
  details.
- `npm run lint` must pass; CI (`.github/workflows/ci.yml`) runs lint, tests
  and the production build on every push.
- For changes that span the API, also run the API suite
  (`cd ../servihub-api && npm test`).

## History

Phase 1 built the UI on mock data; Phase 2 moved every screen to the API;
Phase 3 added Socket.IO; Phase 4 the Groq Copilot. The completion pass
(October 2026) fixed the bugs listed in `../CONTEXT.md` and added
account/session management, team invites, create/edit flows for bookings,
providers and customers, refund requests from anywhere, ticket status
actions, notifications, dashboard periods, deep links and tests. Mock data
(`src/data/`) and its helpers are gone.
