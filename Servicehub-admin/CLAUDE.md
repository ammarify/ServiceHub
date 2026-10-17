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
- `rounded-full` only for things that are circles or capsules by nature:
  avatars, status and unread dots, count badges, step markers, round icon
  tiles, and progress/meter tracks.
- Chat bubbles are `rounded-card` with the one corner nearest the sender
  squared off as a tail (`rounded-tl-none` / `rounded-tr-none` in Support,
  `rounded-bl-none` / `rounded-br-none` in the simulator widget). That is
  the only partial radius in the app.
- Never use any other radius value anywhere in the app.

### Shadows

- `shadow-card` → light mode: `0 1px 2px rgb(0 0 0 / 0.04)`. Dark mode:
  `none` — cards in dark mode get depth only from surface color steps and
  borders.
- `shadow-pop` → floating layers only: menus, popovers, dialogs, drawers,
  toasts and the guided tour. Light: `0 12px 32px -12px rgb(16 24 40 /
  0.18), 0 2px 6px -2px rgb(16 24 40 / 0.08)`; dark: `0 16px 40px -12px
  rgb(0 0 0 / 0.75)` (a layer floating over dark surfaces needs it to read
  as on top). Never on cards or anything in the page flow.

## Typography

- UI text font: **Inter** (`@fontsource-variable/inter`, the default body
  font). Body and table text: 13–14px. Section labels: 15px max.
- **Every data value** — IDs, amounts, dates, times, counts, percentages —
  renders in **JetBrains Mono** via the `.font-data` utility class. Hard rule,
  no exceptions. All formatting goes through `src/lib/formatters.js`.
- Page titles: 20px / weight 600 (`text-[20px] font-semibold`); the same
  size names the subject of a page (a booking code, the person on the
  account page, an error page's title). No text anywhere in the app may
  exceed 24px.
- The rest of the scale, and nothing else: 10px for `<kbd>` hints and the
  role caption under a name; 11px uppercase labels and table headers;
  12px captions; 15px section titles; 17px the tour's welcome title; 18px
  amounts in detail cards; 22px the headline on the sign-in panel and the
  simulator; 24px the KPI figures on the dashboard.

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
- **Tables**: `<DataTable>` only. Row height 48px, 13px body text, one line
  per row (cells don't wrap — narrow screens scroll the table sideways).
  Header row is an 11px uppercase `text-text-secondary` band on
  `bg-canvas/60`; sortable headers are buttons with an arrow and
  `aria-sort`. Clickable rows are focusable and open with Enter or Space.
  Identify people with an `<Avatar>` and services with `<ServiceLabel>`;
  an unassigned provider reads "Unassigned", never a dash.
- **Pagination**: `<Pagination>` in the table's `footer`, never in the
  toolbar: "Showing 1–10 of 55 bookings", rows per page (10/25/50,
  remembered per list by `usePageSize(list)`), previous/next icon buttons
  and numbered pages. The total shows even when everything fits on one
  page.
- **Buttons**: three variants only — primary (accent background), secondary
  (surface background + border), ghost (no background/border until hover).
  Height 34px. No gradients, ever. For a destructive action use
  `tone="danger"` on `<Button>`, never a `text-danger` className override
  (Tailwind resolves conflicting utilities by registration order, not by
  which one you wrote last). Missing variant/tone combinations go into
  `Button.jsx`'s `VARIANT_TONE_CLASSES` map.
- **Cards**: `bg-surface`, 1px `border-border`, `rounded-card`, 20px padding.
- **Confirmation**: anything destructive or hard to undo (delete, cancel a
  booking, reject or approve a refund, mark completed, disable an account,
  withdraw an invitation, sign out everywhere) asks first through
  `useConfirm()`: a title that names the record ("Delete Crystal
  Howard?"), what will happen, a confirm button that repeats the action's
  name, `tone="danger"` for destructive ones and an icon. Dialogs that also
  collect input (cancel reason, refund note) use `<ConfirmDialog>` with the
  same anatomy.
- **Feedback**: every create, update, delete and status change ends with a
  toast that names the record and the outcome ("Crystal Howard deleted.",
  "Booking BK-4853 cancelled."). Errors stay inline next to the field or in
  the dialog that caused them (`<FormField error>` or a `role="alert"`
  paragraph); `toast.error` only for actions with no inline place (row
  menus, header quick actions).
- **Deleting**: only what has no history (see `servihub-api/SECURITY.md`).
  Profiles end with a `<DangerZone>`; when the API would refuse, the button
  is disabled and the zone says why and what to do instead.
- **Empty states**: `<EmptyState icon title description action>`: what's
  missing and, when there is one, the next step as a button.
- **Search and commands**: one command palette (`layouts/CommandPalette`,
  Ctrl/Cmd + K, the sidebar search box, or the topbar button below lg). It
  lists the pages from `NAV_GROUPS` the role can open, quick actions
  (`buildCommands`) and search results. A new page goes into `NAV_GROUPS`;
  an action that opens a form deep-links with `?new=1`, like `/bookings`
  and `/refunds`. Don't add other global search boxes.
- **Navigation counts**: only for work waiting on someone (open tickets,
  refunds waiting for a decision), from `useNavCounts` in `Sidebar`. Read
  them from list queries under `["tickets", "list"]` / `["refunds", "list"]`
  so realtime invalidation keeps them current.
- **Detail pages**: a summary card first (icon tile, code + status, a meta
  line, actions with the next lifecycle step as the primary button), then
  progress where the record has a lifecycle (`BookingProgress`), an
  activity feed with an icon and tone per event, and facts as `InfoList` /
  `InfoRow`.
- **Pickers**: `SearchSelect` opens on a click, typing or ↓, never on focus
  alone, so a dialog that focuses it first isn't covered by suggestions.

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
  components/      Feature components shared by several pages: dashboard
                   cards and dashboard/ (KpiStrip, Sparkline,
                   DashboardHeader, ListCard), tour/ (GuidedTour and the
                   role-aware steps), ServiceIcon / ServiceLabel,
                   refunds/RequestRefundDialog.
  context/         AuthContext, SocketContext, NotificationContext,
                   ToastContext, ConfirmContext, TourContext,
                   CommandPaletteContext, ThemeContext.
  hooks/           TanStack Query hooks, one file per API resource, plus
                   useTicketSocket. Components never call lib/api.js
                   directly - they go through these hooks.
  layouts/         AppLayout (sidebar + topbar + permission check),
                   Sidebar, Topbar, CommandPalette (and the SidebarSearch
                   button that opens it), NotificationsMenu, RangePicker,
                   UserMenu, RealtimeBridge, AuthLayout, AuthBrandPanel.
  lib/             api.js (axios + silent refresh), socket.js,
                   permissions.js, formatters.js, pagination.js, small
                   hooks (useDebouncedValue, useDismiss, useMediaQuery,
                   useQueryParamState, useDocumentTitle, usePageSize).
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

- `src/context/ThemeContext.jsx` provides `{ theme, preference, setTheme,
  toggleTheme }` via `useTheme()`. `theme` is what's showing (`"light" |
  "dark"`); `preference` is `"light" | "dark" | "system"`, set with
  `setTheme()` (Account → Appearance). `toggleTheme()` picks the opposite
  of what's showing.
- "system" follows the device live; only an explicit choice is stored
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
- `/simulator` stands in for the customer-facing chat widget: a public page
  (no sign-in) built from the same tokens and primitives, clearly labelled
  "Demo customer simulator", with its own theme toggle. It uses its own
  socket from `createSimulatorSocket()` and per-ticket tokens from the API,
  and exists only when the API runs in DEMO_MODE.
- Support conversations: customer bubbles on the left (surface + border),
  agent bubbles on the right (`bg-accent text-white`), grouped by sender
  with the avatar and name on the first bubble and the time under the
  last; day separators; the other side's typing shows as a bubble with
  `<TypingDots>`. The thread follows new messages only while the agent is
  at the bottom; otherwise a "N new messages" button appears.
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
| `ConfirmDialog` | `open`, `onClose`, `title`, `description`, `icon`, `tone="default"\|"danger"\|"warning"`, `footer`, `onSubmit`, `widthClassName` | Centered modal (portaled to `body`); `icon` sits in a tinted circle of `tone`'s color. With `onSubmit` the body is a `<form>` (Enter submits). For a plain yes/no question use `useConfirm()` instead. |
| `DataTable` | `columns` (`{ key, label, align, sortable, render }`), `data`, `getRowKey`, `getRowClassName`, `onRowClick`, `sortKey`, `sortDirection`, `onSortChange`, `isLoading`, `isFetching`, `emptyState`, `skeletonRowCount=8`, `footer` | 48px one-line rows; `min-w-[720px]` inside `overflow-x-auto`. `isFetching` dims the rows while a new page loads; `footer` holds the `Pagination`. |
| `Pagination` | `page`, `pageSize`, `total`, `totalPages`, `onPageChange`, `onPageSizeChange`, `label="results"` | "Showing 1–10 of 55 bookings", rows per page (when `onPageSizeChange` is given), previous/next icon buttons and numbered pages ("1 / 6" on phones). Renders nothing for an empty list. |
| `EmptyState` | `icon`, `title`, `description`, `action` | Every list's empty state. |
| `DangerZone` | `title`, `description`, `actionLabel`, `onAction`, `disabled`, `disabledReason`, `isPending` | The destructive section at the end of a profile; shows `disabledReason` instead of `description` when disabled. |
| `TypingDots` | `className` | Three animated dots for "is typing". |
| `InfoList` / `InfoRow` | `InfoRow`: `icon`, `label`, `mono=false`, children | Facts about a record (phone, area, rating, dates) as icon + label + value rows in a `<dl>`. Use instead of stacks of `DetailField` in cards and drawers. |
| `FormField` | `label`, `hint`, `error`, `className` | Wires the label, hint and error to the single control inside it. |
| `Input` / `Select` / `Textarea` / `Checkbox` | native props (`Checkbox` adds `label`) | Token-styled native controls. |
| `SearchSelect` | `value`, `onChange`, `useOptions(query)`, `getKey`, `renderOption`, `renderValue`, `placeholder`, `emptyText` | Accessible combobox for picking a record from the API. |
| `QueryError` | `message`, `onRetry`, `className` | Icon + message + ghost Retry. |
| `Avatar` | `name`, `size=28` | Initials on an accent-tinted circle. |
| `Logo` | `size=28` | Same mark as `public/favicon.svg`. |

Outside `components/ui/`: `ServiceIcon` / `ServiceLabel`
(`components/ServiceIcon.jsx`) give each service its icon wherever a
service is named in a list (`strong` is the larger outlined tile for a
record's header), and `PasswordStrength` (`components/`) goes under every
new-password field.

Micro-interactions live in `index.css` and are limited to these:
`animate-page-enter` (route change), `animate-dialog-enter` /
`animate-overlay-enter` (dialogs, drawers, toasts, the tour),
`animate-highlight-pulse` ("this row just changed"), `animate-typing-dot`
(`TypingDots`), `animate-live` (the green "live" dot: dashboard header,
sign-in panel, simulator) and
`animate-toast-countdown` (the bar showing how long a toast stays; it
pauses on hover or focus) and `animate-preview-enter` (the sign-in
preview cards, once, staggered with inline delays).

## Feedback API

- `const confirm = useConfirm()` (`context/ConfirmContext.jsx`), then
  `await confirm({ title, description, confirmLabel, pendingLabel,
  cancelLabel, tone, icon, onConfirm })` → `true` once `onConfirm` has
  finished, `false` if the person backed out. While `onConfirm` runs the
  button shows `pendingLabel`; if it throws, the dialog stays open and shows
  the error, so a failed delete is never reported as done. Typical use:
  `if (await confirm({ ..., onConfirm: () => mutation.mutateAsync(id) }))
  toast.success("… deleted.")`.
- `const toast = useToast()`: `toast.success(message, { title? })`,
  `toast.error(...)`, `toast.info(...)`. Success and info stay 4.5s, errors
  7s; each has a dismiss button and a countdown bar, and at most four are
  shown at once.
- Both providers are mounted once in `main.jsx` (and in
  `test/render.jsx`).

## Guided tour

- After someone's first sign-in in a browser, `TourProvider`
  (`context/TourContext.jsx`, mounted in `AppLayout`) opens a short
  spotlight tour. It's remembered per user in
  `localStorage["servihub-tour:<userId>"]` whether finished or skipped, and
  replayed from the profile menu ("Take the tour", `useTour().startTour()`).
- Steps come from `buildTourSteps(user)` in `components/tour/tourSteps.js`,
  filtered by permission, so a role is never shown a page it can't open.
  Each step points at a `data-tour` anchor (`nav`, `search`,
  `nav-<path>`, `notifications`, `range`, `user-menu`, `menu-button` on
  phones); steps whose anchor isn't on screen are skipped when the tour
  starts. Keep the anchors when you restructure the shell, and add one when
  a new top-level page deserves a step.
- Skippable at every step ("Skip for now" on the welcome card, "Skip tour",
  the close button or Escape); → / ← move between steps and focus stays in
  the popover.

## Gotchas

- Tailwind v4 orders responsive variants by the breakpoint list, so mixing
  a named breakpoint (`sm:`, `xl:`) with an arbitrary one
  (`min-[1100px]:`) on the same property can let the smaller one win. Use
  the named breakpoints only.
- Menus inside a table or any `overflow` container are clipped: portal them
  to `document.body` with fixed positioning (see `TeamRowMenu`), and pass
  both the trigger and the menu to `useDismiss([triggerRef, menuRef], isOpen, close)`.
- The window never scrolls: the app shell is `relative h-dvh
  overflow-hidden` and only `<main>` (or a page's own panes) scrolls. Keep
  it that way. Never put `sr-only` on a `<table>` (a table ignores the
  height and overflow it sets, so a long one stretches the page); wrap it in
  `<div className="sr-only">`.
- Height breakpoints: `short:` (max-height 760px, e.g. 1920×1080 at 125%)
  and `shorter:` (max-height 640px) are custom variants in `index.css`.
  The sign-in pages use them, plus a preview that scales to the space it
  gets, so they never scroll on laptop screens. Check new full-height
  layouts at 1536×702 (the most common laptop setup) as well as large
  screens.

## Testing

- `npm test` runs Vitest with jsdom and Testing Library (`src/**/*.test.jsx?`).
- `src/test/render.jsx` renders with every provider; `src/test/mockApi.js`
  stubs the axios instance per test; `src/test/setup.js` adds what jsdom
  lacks (`matchMedia`, `scrollIntoView`). Code that needs `ResizeObserver`
  checks for it first. Prefer testing behaviour a user would
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

The UI polish pass (October 2026) moved the sign-in form to the right of a
product panel, rebuilt the dashboard (greeting and live status, KPI tiles
with sparklines, a bookings/revenue trend, status shares, list cards),
redesigned tables and pagination, added confirmations and toasts to every
destructive or changing action, safe deletes for providers, customers and
pending invitations, the guided tour, and the chat-style support
conversation and customer simulator. `StatCard` was replaced by
`dashboard/KpiStrip`. A second round the same month stopped the window
from ever scrolling (dashboard and sign-in pages), and added the command
palette, sidebar counts, the booking progress tracker and activity feed,
richer drawers, the account page's appearance settings and password
strength, and the redesigned error pages.
