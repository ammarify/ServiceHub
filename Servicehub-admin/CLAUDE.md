# ServiHub Admin — Design System & Engineering Constitution

ServiHub Admin is an internal admin panel for a home-services marketplace
(cleaning, AC repair, plumbing). Phase 1 is UI only, with realistic mock
data — no backend. This document is binding for every future session.
Follow it exactly; do not improvise new tokens, colors, or patterns.

## Design Tokens

All tokens are defined as CSS custom properties in `src/index.css` (`:root`
for light mode, `.dark` for dark mode) and re-exposed to Tailwind via the
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
Theme System below). Never hardcode hex colors in components — always use
the token utility classes above.

### Radius

- `rounded-card` → 8px. Use for cards and inputs.
- `rounded-btn` → 6px. Use for buttons and badges.
- Never use any other radius value anywhere in the app.

### Shadows

- `shadow-card` → light mode: `0 1px 2px rgb(0 0 0 / 0.04)` (very subtle).
  Dark mode: `none`. The variable flips automatically with the `.dark`
  class — depth in dark mode comes only from surface color steps and
  borders, never shadows.

## Typography

- UI text font: **Inter** (`@fontsource-variable/inter`, mapped to
  `font-sans` / the default body font). Body and table text: 13–14px.
  Section labels: 15px max.
- **Every data value** — IDs, amounts, dates, times, counts, percentages —
  must render in **JetBrains Mono** (`@fontsource-variable/jetbrains-mono`).
  This is a hard rule with no exceptions. Use the `.font-data` utility
  class (defined in `src/index.css`) on any element showing a data value.
  All formatting for these values must go through `src/lib/formatters.js`
  (see Architecture Rules).
- Page titles: 20px / weight 600 (`text-[20px] font-semibold`). No text
  anywhere in the app may exceed 24px.

## Component Grammar

- **Status indicators**: never a filled pill badge. Always a small 6px
  colored dot + an uppercase JetBrains Mono label, e.g. `● IN_PROGRESS`.
  Build exactly one `<StatusBadge />` component in `components/ui/` and
  reuse it everywhere a status appears (bookings, providers, refunds,
  support tickets, etc.). Do not create ad-hoc status UI elsewhere.
- **Tables**: compact density. Row height 44px, 13px body text. Header row
  is 11px uppercase `text-text-secondary` with letter-spacing.
- **Buttons**: three variants only — primary (accent background),
  secondary (surface background + border), ghost (no background/border
  until hover). Height 34px. No gradients, ever, on any element. For a
  destructive action (e.g. "Cancel booking"), use the `tone="danger"` prop
  on `<Button>` rather than passing a `text-danger`/`border-danger`
  className override — `Button`'s own variant classes already set a text
  color, and a caller-supplied color class racing against it in the same
  `clsx()` call is a real bug (Tailwind resolves the conflict by utility
  registration order, not by which one you wrote second — it silently
  picked the wrong one here once already). If a variant/tone combination
  you need doesn't exist yet, add it inside `Button.jsx`'s
  `VARIANT_TONE_CLASSES` map, don't fight it from the outside.
- **Cards**: `bg-surface`, 1px `border-border`, `rounded-card`, 20px
  padding.

## Hard Rules (never violate)

- No gradients. No purple/violet anywhere in the palette. No emoji in the
  UI. No oversized hero-style padding — this is a dense professional tool
  in the spirit of Linear/Stripe, not a marketing site.
- Every list/table screen must ship with a designed empty state and a
  skeleton loading state. A screen is not done without both.
- Every interactive element (buttons, links, inputs, nav items) must have
  a visible keyboard focus state. The global `:focus-visible` outline in
  `src/index.css` covers most cases automatically — don't suppress it with
  `outline-none` unless you replace it with an equally visible alternative.
- Respect `prefers-reduced-motion` (already handled globally in
  `src/index.css`); don't introduce animations that ignore it.

## Typography & Color Don'ts

- Don't invent new colors, radii, shadows, or font sizes outside what's
  listed above. If a screen seems to need one, that's a signal to reuse an
  existing token, not add a new one.

## Architecture Rules

- **JavaScript only** — no TypeScript. Functional components + hooks only,
  no class components.
- Folder structure (all under `src/`):
  ```
  src/
    components/ui/      Reusable primitives: Button, Card, StatusBadge,
                         Table, Input, etc. Generic, feature-agnostic.
    components/         Feature-specific components composed from ui/.
    layouts/             AppLayout (sidebar + topbar) and any other
                         route-level layout wrappers.
    pages/               One folder per module (dashboard, bookings,
                         providers, customers, support, refunds, settings,
                         login). Pages compose components; they don't
                         define new visual primitives inline.
    data/                Phase 1 mock data. Now emptied to a pointer comment
                         for every resource servihub-api serves (bookings,
                         customers, providers, refunds, tickets) — kept only
                         so git history and the Phase 1→2 story stay clear.
                         `team.js` is the one exception: Settings/team
                         management has no backend endpoints yet, so it's
                         still live mock data consumed by `useTeamList.js`.
    hooks/               TanStack Query hooks, one file per API resource
                         (see "Phase 2 — Live API data" below). Pages/
                         page-local `use*List.js` hooks call these; they
                         never call `src/lib/api.js` directly.
    context/             ThemeContext and AuthContext (both implemented).
    lib/                 Helpers, formatters, permissions.js, api.js (axios
                         instance), useDebouncedValue.js.
  ```
- Keep components small and readable. Prefer clarity over cleverness —
  this codebase is read far more than it's written.
- All currency, date, and relative-time formatting goes through
  `src/lib/formatters.js` (`formatUSD` → `"$4,500"` / `"$1,240.50"`,
  `formatDate`, `formatDateTime`, `formatTime`, `relativeTime` → `"2h ago"`,
  `formatNumber`, `formatPercent`, `initials`). Never call `Intl` or format
  numbers/dates/names inline in a component — add a formatter to this file
  instead.

## Theme System

- `src/context/ThemeContext.jsx` provides `{ theme, setTheme, toggleTheme }`
  via `useTheme()`. Theme is `"light" | "dark"`.
- Default: system preference (`prefers-color-scheme`), unless the user has
  previously chosen a theme, in which case the stored choice
  (`localStorage["servihub-theme"]`) wins.
- An inline script in `index.html` sets the `.dark` class on `<html>`
  before React hydrates, to avoid a flash of the wrong theme.
- Never read/write theme state anywhere except through `useTheme()`.

## Auth & Permissions

- `src/context/AuthContext.jsx` provides `{ user, isLoading, login,
  demoLogin, logout }` via `useAuth()`. `user` is `null` or `{ id, name,
  email, role }`, sourced from `servihub-api` (see `../servihub-api`) —
  there is no local persistence at all now. `login(email, password)` and
  `demoLogin(role)` both `POST` to the backend and set `user` from the
  response body; the backend sets the actual session as httpOnly cookies,
  never touched directly by this code. On mount, `AuthProvider` calls
  `GET /auth/me` once to restore the session from those cookies (`isLoading`
  is `true` until that resolves) — `App.jsx` renders `<FullPageLoader/>`
  while `isLoading` is true instead of routing, so there's no flash of the
  login page for an already-signed-in user on refresh. `logout()` calls
  `POST /auth/logout` (clears the cookies server-side) then clears `user`.
  All requests go through `src/lib/api.js`'s shared axios instance
  (`withCredentials: true`), which also owns silent token refresh — see
  its own comments for the queued-concurrent-401s logic.
- The same file exports two route guards used in `App.jsx`:
  `<RequireAuth>` (redirects to `/login` if signed out) and
  `<RedirectIfAuthed>` (redirects to `/dashboard` if already signed in —
  used to wrap `/login` itself). These only guard whether a route is
  reachable *at all* (i.e. signed in or not) — they say nothing about
  whether *this* signed-in role should see *this* page. That's
  `AppLayout.jsx`'s job (see below) and `permissions.js`'s data.
- `src/lib/permissions.js` exports `canViewPath(role, path)` and
  `can(role, action)`. `canViewPath` does prefix matching
  (`path === allowedPath || path.startsWith(allowedPath + "/")`), not exact
  matching — it has to, since it's used for two different jobs: `Sidebar`
  calls it with a literal nav path like `/bookings` (exact match), but
  `AppLayout` calls it with the *actual current pathname*, which for a
  detail route is `/bookings/BK-4801` (needs the prefix match to resolve
  against the `/bookings` entry). Actions so far: `"refund.approve"`
  (super_admin, manager, finance), `"booking.reassign"` (super_admin,
  manager), `"team.manage"` (super_admin only). Add new actions here as
  screens need them, never inline a role check in a component.
- **`permissions.js` is UI visibility only — the backend is the actual
  enforcement authority.** `servihub-api/src/middleware/rbac.js` holds the
  real permissions map and is what every API route checks; this frontend
  copy only decides what to *show* (hide a button, redirect off a page).
  A role denied server-side but not gated here would still see a button
  that 403s when clicked — annoying, not a security hole, since the API
  call itself is what actually protects the data. But the reverse (a
  permission tightened in `rbac.js` without updating here) produces exactly
  that annoying case, so **whenever the backend's permissions map changes,
  update this file to match in the same pass.** The two are not
  auto-synced; nothing enforces they stay identical except discipline.
- **Every route is permission-checked, not just nav-hidden.** `AppLayout.jsx`
  checks `canViewPath(user.role, location.pathname)` for whatever's about to
  render in `<Outlet/>` and renders `<ForbiddenPage/>`
  (`src/pages/errors/ForbiddenPage.jsx` — "Access denied" + back-to-dashboard
  button) instead if it fails. This catches direct URL navigation to a page
  a role's nav hides — e.g. `finance` typing `/providers` into the address
  bar — which a nav-visibility-only check (the old state of things) doesn't.
  `/` is exempted from the check since it's just a redirect stub to
  `/dashboard` (see `App.jsx`), not a real page.
- Roles: `super_admin` (everything), `manager` (everything except
  Settings), `support_agent` (Dashboard, Bookings, Support, Refunds),
  `finance` (Dashboard, Bookings, Refunds). The demo-access buttons on
  `/login` are a permanent product feature, not scaffolding to remove
  later.
- **Permission audit (as of the Refunds/Settings pass):** every action that
  maps to a defined permission now actually calls `can()` — `refund.approve`
  gates the Approve/Reject buttons in `RefundDrawer.jsx` (support_agent sees
  a "Approval requires Manager role" note instead, per spec — finance and
  manager both still get the real buttons, the note is specifically the
  support_agent case), and `team.manage` gates Add Member / Change Role /
  Disable in Settings (currently a no-op check in practice, since the
  `AppLayout` route guard already keeps everyone except super_admin off
  `/settings` entirely — kept anyway so the actions stay correctly gated if
  `/settings` visibility ever changes without someone remembering to update
  these too). `booking.reassign` was already correct from the Bookings pass.
  Grepped for inline `role ===` comparisons bypassing `can()`/`canViewPath`
  — found none outside `AuthContext.login()`'s role-to-team-member lookup,
  which isn't a permission check. Left ungated on purpose: Support's "Mark
  resolved"/"Escalate" — no permission was ever specified for these across
  any prior task, so adding one now would be inventing a rule, not fixing a
  gap.

## Current State (Phase 1 foundation)

As of this setup: Tailwind v4 + design tokens, routing, theming, and auth
(with role-based sidebar visibility) are all in place. `components/ui/` has
Button, Avatar, Input, Logo, Card (`padded` prop, default `true`, set
`false` for content that manages its own spacing like `DataTable`),
StatusBadge (doubles as the priority badge, the provider-availability badge,
and the copilot sentiment badge — same dot+mono grammar, see its
`STATUS_TONE` map, which also has `available`/`off_duty` and
`frustrated`/`concerned`/`neutral` entries), Skeleton, DataTable, Toolbar,
ConfirmDialog, DetailField, and Drawer. Drawer takes `side="left"|"right"`
(default `right`) and `padded` (default `true`, set `false` when the child
renders its own header/padding, e.g. `TicketQueue`/`CopilotPanel` inside a
slide-over) — it stays mounted through its close transition via
`onTransitionEnd` so it animates both ways; don't clear the selected-row
state on close, only the `open` flag, or the content will vanish before the
panel finishes sliding out. `title` is optional — omit it when the child
already renders its own header, to avoid a duplicate header bar.

- `/dashboard` is built: KPI row, a recharts bar chart ("Bookings — last 14
  days"), a status breakdown card, and recent-bookings/open-tickets lists —
  all computed from `src/data/` in `src/pages/dashboard/dashboardStats.js`.
  That file anchors "now" to a fixed `MOCK_NOW` (matching the moment the
  mock data was generated) instead of the real device clock, so date-window
  KPIs ("today", "this week") stay meaningful regardless of when the app is
  opened. Loading skeletons are simulated with `src/lib/useMockLoad.js`.

- `/bookings` and `/bookings/:id` are built. The list page's search/filter/
  sort/pagination state lives in `src/pages/bookings/useBookingsList.js`
  (a hook, not a pure function like `dashboardStats.js`, since it owns
  interactive state). The detail page holds `providerId`/`status`/
  `timeline` as local component state seeded from the matching
  `src/data/bookings.js` entry — reassigning a provider or cancelling a
  booking updates that local state only, it never mutates the imported
  data array (which is a shared module-level singleton; mutating it
  directly would leak across the whole app and wouldn't even trigger a
  re-render). "Reassign provider" and "Cancel booking" are both gated by
  `can(role, "booking.reassign")` per the spec that introduced them — there
  is no separate `booking.cancel` action. Reassign candidates are providers
  offering the same `service` as the booking, excluding whichever provider
  is currently assigned.

- `/providers` and `/customers` are built as quieter directory pages (no
  action buttons, muted accents) using the row-click-opens-a-Drawer pattern
  instead of a detail route. Each has its own `use*List.js` hook
  (`useProvidersList.js`, `useCustomersList.js` — search/filter only, no
  sort, since neither spec asked for sortable columns). Numbers that read
  as "computed from bookings" in the spec are computed fresh from
  `src/data/bookings.js` at drawer-render time (provider Jobs/Earnings in
  `ProviderDrawer.jsx`) rather than reusing a provider's static
  `jobsCompleted` field — the two can legitimately differ, since
  `jobsCompleted` is the provider's lifetime total and the drawer only
  knows about the 55 bookings in this mock dataset. The table's own "Jobs"
  column intentionally still shows the static `jobsCompleted` field, since
  the spec only asked for the drawer's stats row to be computed.

- `/support` is a full-width, 3-column workspace — the one exception to the
  app's usual `max-w-300 mx-auto p-6` content wrapper. `AppLayout.jsx` checks
  the route (`FULL_WIDTH_PATHS`) and skips that wrapper (and switches `main`
  to `overflow-hidden`) for paths that need to manage their own height and
  scrolling, which `/support` does: ticket queue, conversation, and copilot
  panel each scroll independently rather than the page itself scrolling.
  `useMediaQuery.js` (new, in `lib/`) drives two structural breakpoints —
  below 1100px the copilot panel and below 800px the ticket queue switch
  from a persistent column to a `<Drawer>` (queue uses `side="left"`) —
  these are real conditional rendering, not just CSS hiding, since the same
  `CopilotPanel`/`TicketQueue` content moves between a column and a
  slide-over depending on viewport.
  - `useSupportTickets.js` holds all ticket state (status, priority,
    messages) as local component state seeded from `src/data/tickets.js`,
    same pattern as bookings/refunds elsewhere: mutations never touch the
    imported array. "Escalate" bumps priority to `high` (visible back in
    the queue's priority badge); there's no separate "un-escalate".
  - The copilot panel's SUMMARY/SENTIMENT/REFUND ELIGIBILITY/SUGGESTED REPLY
    content is hand-written per ticket in `copilotFixtures.js`, not
    generated — it's a Phase 1 stand-in for a real model call. It's
    deliberately cross-checked against `src/data/refunds.js` (e.g. a ticket
    whose linked booking already has an approved refund shows "Already
    approved" rather than a generic "Eligible" verdict) so the two screens
    never contradict each other. Analysis results are cached per ticket id
    within `CopilotPanel`'s own state, so switching tickets and back
    doesn't lose a prior "Analyze" run.

- `/refunds` is built: tabs (Pending/Approved/Rejected, mono counts) →
  `DataTable` → row click opens `RefundDrawer.jsx`. `useRefundsList.js` holds
  local refund state (same never-mutate-the-import pattern as everywhere
  else) and exposes both the tab-filtered list (for the table) and the full
  unfiltered list (`allRefunds`, so the drawer can still find and display a
  refund that just got approved/rejected and dropped out of the currently
  active tab — same trick `useSupportTickets.js` uses). Approving/rejecting
  stamps `decidedBy` with `user.id` directly, since a logged-in user's `id`
  *is* already a `src/data/team.js` id (see how `AuthContext.login()`
  constructs `user`) — no separate lookup needed.
  - **`ConfirmDialog` inside `RefundDrawer` is rendered as a sibling of
    `<Drawer>`, never nested inside it.** `Drawer`'s sliding panel has a
    `transition-transform` / `translate-x-*` class on it, and any element
    with a CSS `transform` becomes the containing block for
    `position: fixed` descendants — so a `ConfirmDialog` (which is `fixed
    inset-0`) nested inside a `Drawer`'s children would size and center
    itself against the drawer panel instead of the viewport, not a full-
    screen modal. Keep this in mind for any future drawer content that
    wants to pop a confirm dialog.
- `/settings` (TEAM section only for Phase 1) is built and is the reason
  `AppLayout`'s route guard exists — `manager` and below now get
  `ForbiddenPage` instead of ever reaching `SettingsPage`. `useTeamList.js`
  seeds from `src/data/team.js` with a `status: "active"` field added locally
  (team.js itself has no status field — nobody starts disabled). Newly
  added members get a real `TM-0XX` id from an incrementing `useRef`
  counter (not `members.length + 1`, which would collide if it read from a
  stale closure) and a real `joinedAt` timestamp (`new Date().toISOString()`
  — this is a fresh action happening now, unlike the seeded rows, so real
  time is correct here the same way it is for a freshly-sent support
  message). The row "…" menu (`TeamRowMenu.jsx`) reuses the exact
  outside-click/Escape pattern already established in
  `layouts/UserMenu.jsx` rather than inventing a new one.

## Phase 1 complete — reusable `components/ui/` primitives

Phase 1 (UI-only, mock data, no backend) is done. Every screen has been
audited for token/spacing/typography compliance, keyboard access, and
dark-mode contrast (see the final QA pass below). Before adding a new
primitive in Phase 2, check this list — it is exhaustive as of the end of
Phase 1.

| Component | Props | Notes |
|---|---|---|
| `Button` | `variant="primary"\|"secondary"\|"ghost"` (default `"secondary"`), `tone="default"\|"danger"` (default `"default"`), `className`, `...props` (spread onto `<button type="button">`) | Height 34px. Color comes from `VARIANT_TONE_CLASSES[variant][tone]` — never override text color via `className`, add a new entry to that map instead. Has `active:translate-y-px` press state built in. |
| `Card` | `padded=true`, `className`, `children` | `rounded-card` + `border-border` + `shadow-card`. Set `padded={false}` for content that manages its own spacing (e.g. wraps a `DataTable`). |
| `StatusBadge` | `status` (string key into `STATUS_TONE`) | The **only** status UI in the app — 6px dot + uppercase mono label. Reused for booking/refund/ticket status, ticket priority, provider availability, copilot sentiment, and team member active/disabled. Add new status strings to `STATUS_TONE` in `StatusBadge.jsx` rather than building ad-hoc status UI. Unknown status falls back to `"info"` tone. |
| `Skeleton` | `className` | Single `animate-pulse` block; size/shape entirely via `className`. Every list/table screen needs a skeleton state built from this. |
| `Toolbar` | `children`, `className` | Just a `flex flex-wrap items-center gap-3` wrapper for filter bars above tables. |
| `DetailField` | `label`, `children`, `mono=false` | Label/value pair for drawer and detail-page "info card" rows. Set `mono` for any data value per the JetBrains Mono hard rule. |
| `Drawer` | `open`, `onClose`, `title` (optional — omit if child renders its own header), `children`, `widthClassName="max-w-md"`, `side="left"\|"right"` (default `"right"`), `padded=true` | Stays mounted through its close transition (`onTransitionEnd`) so it animates both directions — don't clear selected-row state on close, only `open`. 180ms ease-out slide. Escape closes it. Never nest a `ConfirmDialog` inside its children (see Refunds note above) — render as a sibling. |
| `ConfirmDialog` | `open`, `onClose`, `title`, `children`, `footer` (optional, right-aligned button row) | Centered modal, 180ms scale+fade in via `animate-dialog-enter`/`animate-overlay-enter`. Escape closes it. Always render as a sibling of any `Drawer`, never a descendant. |
| `DataTable` | `columns` (array of `{ key, label, align, sortable, render(row) }`), `data`, `getRowKey(row)`, `getRowClassName(row)` (optional, e.g. for the highlight-pulse micro-interaction), `onRowClick(row)` (optional), `sortKey`, `sortDirection`, `onSortChange(key)`, `isLoading`, `emptyState`, `skeletonRowCount=8` | 44px rows, 13px body, 11px uppercase header. Wrapped in `overflow-x-auto` with `min-w-[720px]` on the table itself, so narrow viewports (≤768px) get a horizontally scrollable table rather than clipped/reflowed columns — this is the established responsive pattern for tables, don't invent a stacked-card mobile variant instead. |
| `Input` | `className`, `...props` (spread onto `<input>`) | 36px height, `rounded-card`. Native `color-scheme` (set globally in `index.css`) handles dark-mode styling for native form controls. |
| `Avatar` | `name`, `size=28` | Renders `initials(name)` (from `formatters.js`) on an accent-tinted circle. |
| `Logo` | `size=28` | The "S" mark, accent-filled square, `rounded-card`. Same mark used for `public/favicon.svg`. |

Also in place: global `.font-data` utility (JetBrains Mono, tabular figures)
for every data value; four micro-interaction utilities in `index.css`
(`animate-page-enter` 150ms fade+2px rise on route change, `animate-dialog-enter`/
`animate-overlay-enter` 180ms ease-out for drawers/dialogs, `animate-highlight-pulse`
1000ms accent-tinted flash for "this row just changed" — used via `getRowClassName`
on `DataTable` and directly in `TicketQueue`) — all plain CSS keyframes/transitions
so they inherit `prefers-reduced-motion` compliance for free from the global rule;
theme-aware scrollbar styling (`scrollbar-color`/`::-webkit-scrollbar*`) and
`color-scheme` for native form controls; a functional `Cmd/Ctrl+K` global search
(`layouts/SidebarSearch.jsx`, backed by `GET /api/search` as of Phase 2 — see
below) indexing bookings/customers/tickets, arrow-key navigable, Enter to go;
per-page `document.title` via `lib/useDocumentTitle.js`.

**Final QA pass (consistency audit, micro-interactions, keyboard, dark mode,
responsive):** fixed three real inconsistencies found by grep-auditing every
page against the rules above — `Topbar`'s icon buttons were `h-8 w-8`/`size=18`
against the app-wide `h-7 w-7`/`size=16` convention; `BookingProviderCard.jsx`
and `ReassignProviderDialog.jsx` both hand-rolled a dot+text availability
indicator instead of reusing `StatusBadge`; the old inert sidebar search box
suppressed the focus ring (`focus:outline-none`) with no visible replacement,
fixed by rebuilding it into the now-functional `SidebarSearch`. Also fixed a
390px-width bug found during the responsive sweep: `ConversationPanel`'s header
(`pages/support/ConversationPanel.jsx`) let its `shrink-0` button row (Mark
resolved / Escalate / Copilot) overflow off-screen on narrow viewports with no
scroll affordance, hiding the only way to open the AI Copilot drawer on mobile
— fixed by adding `flex-wrap` so the button row drops to its own line instead
of clipping. Full light+dark screenshot sweep of all 9 screens plus keyboard
(Cmd/Ctrl+K search, Escape-closes-drawer, Tab focus ring) and responsive
(1024/768/390px) verification passed with zero console errors.

## Phase 2 — Live API data

Every module (dashboard, bookings, providers, customers, support/tickets,
refunds) now fetches from `servihub-api` via TanStack Query instead of
`src/data/*`. This was a data-source swap, not a redesign — every screen
should look and behave exactly as Phase 1 described above; the sections
below only cover what changed underneath.

- **`src/hooks/`** — one file per API resource (`useDashboard.js`,
  `useBookings.js`, `useProviders.js`, `useCustomers.js`, `useTickets.js`,
  `useRefunds.js`, `useSearch.js`), each exporting plain `useQuery`/
  `useMutation` wrappers around `src/lib/api.js`. Page-local `use*List.js`
  hooks (e.g. `useBookingsList.js`) own UI state (search/filter/sort/page)
  and call these; components never import `src/lib/api.js` directly.
  Query keys are structured arrays — `["bookings", params]` for a list,
  `["bookings", id]` for a detail — so TanStack's default prefix matching
  means `invalidateQueries({ queryKey: ["bookings"] })` catches both list
  and detail entries for that resource in one call. Mutations invalidate
  both explicitly anyway (e.g. `useReassignBooking` invalidates
  `["bookings", id]` *and* `["bookings"]`) since that's clearer to read at
  the call site than relying on prefix-matching alone.
- **`_id` vs `code`.** Every resource from the API has a Mongo `_id`
  (routing/identity) separate from its human-readable `code` (`"BK-4821"`,
  `"TK-108"`, `"RF-31"` — display only). Bookings and tickets/refunds all
  still *display* their code exactly like Phase 1 did; only `/bookings/:id`
  route params and drawer/query lookups switched to `_id`, since that's
  what the API's detail routes accept. Providers and customers never had a
  `code` field even server-side — only `_id` — but since both use the
  row-click-opens-a-drawer pattern (no detail *route*), this is invisible
  in the UI.
  Search results follow the same split: `mono` shows `code` for bookings/
  tickets, and the customer's `phone` for customer results (customers have
  no `code` to show).
- **Loading/error/empty are three different states now, not one.** Phase 1
  only had loading vs. loaded+empty (`useMockLoad` was a fake timer, never
  a real failure). Real network calls can fail, so every list/drawer/detail
  screen also checks `isError` and renders `<QueryError/>`
  (`components/ui/QueryError.jsx` — icon + message + a ghost "Retry" button
  wired to the query's `refetch`) in place of the table/drawer content.
  Drawers (`ProviderDrawer`, `CustomerDrawer`, `RefundDrawer`) gained a real
  loading skeleton for the first time here — Phase 1's version could
  early-return `null` because the data was already in memory; now the
  detail fetch has real latency to cover.
- **Search inputs are debounced 300ms** via `lib/useDebouncedValue.js`
  before they reach a query — applies to every list page's search box and
  to `SidebarSearch`'s Cmd/Ctrl+K query.
- **`GET /api/search?q=`** (new backend endpoint) is what `SidebarSearch`
  now calls instead of the old client-side `globalSearch.js` index (deleted
  — it no longer has data to index against). It matches bookings by code,
  customers by name, and tickets by code, capped at 5 each, and — same as
  every other endpoint — only runs the sub-query for a resource the
  caller's role can actually read (mirrors `servihub-api/src/middleware/
  rbac.js`'s `*.read` rows), so e.g. `finance` never gets customer/ticket
  matches back even though the endpoint itself doesn't 403 the whole
  request.
- **Small backend additions made purely to preserve Phase 1's UI**, not
  requested standalone but needed once the real shapes didn't carry
  everything a screen displayed: `GET /providers/:id` now returns a `jobs`
  count alongside `earnings` (was sum-only); `GET /customers` and
  `GET /customers/:id` compute `totalBookings`/`totalSpent`/`lastBookingAt`
  server-side (the Customer model itself doesn't store these — same
  "derived, not source data" principle as provider earnings); the refund
  list/detail populate now nests the linked booking's customer name;
  `GET /refunds/:id` is a new detail endpoint (refunds were the only
  resource without one, which the drawer needs since a decided refund
  moves out of whatever tab is active).
- **Known gap: "Escalate" needed a backend endpoint that didn't exist.**
  The ticket priority bump had no API route (`PATCH /tickets/:id/status`
  only ever covered `status`, never `priority`) — added
  `PATCH /tickets/:id/priority` (+ `useUpdateTicketPriority`) mirroring the
  status endpoint exactly, same `ticket.resolve` permission gate.
- **`copilotFixtures.js` and the Copilot panel's "Request 50% refund" /
  "Reassign provider" action buttons are untouched** — they were already
  explicitly a Phase 1 stand-in for a real model call (see the Support
  section above) and static UI stubs respectively, and wiring the refund
  button up to the now-available `useRequestRefund` hook would be new
  behavior, not a data-source swap. `useRequestRefund` exists and is ready
  for that button whenever it's actually asked for.
- **Settings/Team is the one module still on mock data.** No team-management
  endpoints exist on the backend yet, so `useTeamList.js` still reads
  `src/data/team.js` (the only non-empty file left in `src/data/`) exactly
  as Phase 1 built it.

## Phase 3 — Real-time (Socket.IO)

Support Center is now live: new tickets, replies, and typing propagate over
a socket connection instead of waiting on polling/refetch. servihub-api's
`src/sockets/index.js` is the server side — auth (httpOnly cookie for
staff, `{ role: "simulator" }` handshake auth for the simulator), rooms
(`ticket:{id}`, plus an `agents` room every staff socket joins), and the
`ticket:new` / `ticket:message` / `typing` / `customer:message` events.
Persistence still only happens in the REST controllers and
`services/ticket.service.js` — sockets are delivery only, per the rule that
introduced them; `customer:message`'s socket handler literally calls the
same `appendMessage()` the REST `addCustomerMessage` controller calls, so
there's one write path regardless of which transport a customer message
arrives on.

- **`src/lib/socket.js`** — two connection styles, both socket.io-client:
  `connectSocket()`/`disconnectSocket()`/`getSocket()` manage a *singleton*
  staff socket (authenticated via the same httpOnly cookies as the REST
  API, `withCredentials: true`), wired into `AuthContext`'s existing
  `useEffect` — connects when `user` becomes truthy, disconnects on logout
  or a failed boot check. `createSimulatorSocket()` instead returns a
  *fresh* socket each call, authenticated only via
  `auth: { role: "simulator" }`, no cookies — used by the simulator page,
  never the singleton.
- **`src/hooks/useTicketSocket.js`** (used by `useSupportTickets.js`) owns
  everything the Support Center needs from the socket: joining/leaving
  `ticket:{id}` as the selected ticket changes, appending a live
  `ticket:message` into the `["tickets", id]` query cache via
  `appendMessageToCache` (exported from `hooks/useTickets.js` — shared with
  the REST `useSendTicketMessage` mutation's `onSuccess`, since a message
  the agent just sent arrives back over their *own* socket too, courtesy of
  the server's `io.to(room).emit(...)` reaching every socket in the room
  including the sender; the dedup check there — "is this already the last
  message?" — is what stops it double-appending), a 2s-decaying
  `typingFrom` state, and the `ticket:new` listener that both invalidates
  the ticket list and calls `incrementNewTicket()` (see
  `NotificationContext` below).
- **`src/context/NotificationContext.jsx`** — just `newTicketCount` +
  `increment`/`clear`, needed because the topbar bell (`layouts/Topbar.jsx`)
  and the thing listening for `ticket:new` (`useTicketSocket`, mounted by
  `SupportPage`) are siblings under `AppLayout`, not parent/child — no
  route-based way to pass this directly. `SupportPage` clears the count on
  mount (visiting Support is treated as acknowledging new tickets).
- **`/simulator`** (`pages/simulator/SimulatorPage.jsx`) is a deliberately
  plain, un-admin-styled page — no `components/ui/*`, no design tokens,
  monospace + plain gray/blue Tailwind defaults, a dashed-border "this is a
  test harness" banner up top. It's the one route rendered *before* the
  `isLoading` auth-boot check in `App.jsx` even runs (checked via
  `location.pathname` ahead of that gate) — it has no login at all, so
  there's nothing for it to wait on. It fetches its customer/booking/
  open-ticket picklists from new public endpoints
  (`GET /tickets/simulator/options`, `GET /tickets/simulator/:id` — the
  existing `POST /tickets` and `POST /tickets/:id/customer-message` were
  already public; these two just extend the same "no customer login exists"
  trust boundary to reads). Its own socket handling lives in the page-local
  `pages/simulator/useSimulatorSocket.js`, not `src/hooks/` — a separate
  connection from the staff singleton, joins/leaves rooms the same way, and
  sends messages via the `customer:message` event (with an ack callback)
  rather than the REST endpoint, since that's the path the task's socket
  design built for live sending.
- **StrictMode gotcha (real bug, found via the two-browser-context
  verification below, not hypothetical):** `useSimulatorSocket`'s cleanup
  effect called `socket.disconnect()`; in dev, React 18 StrictMode
  double-invokes effects (mount → cleanup → mount again), and
  socket.io-client does *not* auto-reconnect a socket you explicitly
  disconnected. The staff singleton in `lib/socket.js` survived this by
  accident — `disconnectSocket()` nulls out the module-level reference, so
  the second StrictMode mount's `connectSocket()` builds a fresh socket
  instead of trying to revive a dead one. The simulator hook held one
  `useState`-created socket for its whole lifetime with no equivalent
  reset, so after the double-invoke it stayed silently disconnected — the
  first REST-driven ticket creation still worked, but every *socket* event
  after that (agent replies, typing) never arrived. Fixed by calling
  `socket.connect()` at the top of the effect, so the second mount revives
  the same instance instead of leaving it dead. Symptom if this regresses:
  simulator can start a ticket but never sees live replies or typing.
- **Verification method:** two Playwright browser *contexts* (isolated
  cookie jars) in one script — one logged in as `support_agent` on
  `/support`, one on `/simulator` with no login — driving both sides of the
  demo flow (simulator starts a ticket → agent's queue updates live with
  the topbar dot → agent replies → simulator sees it instantly → typing
  both ways) and asserting on rendered text in each context rather than
  just screenshotting. This is what caught the StrictMode bug above; a
  single-browser click-through wouldn't have, since the failure only shows
  up as "the *other* party's side never updates."

## Phase 4 — AI Copilot (Groq)

`CopilotPanel.jsx`'s Phase 1 static preview (`copilotFixtures.js`, keyed by
`ticket.code`, hand-written per-ticket text) is gone. The panel now calls a
real `POST /tickets/:id/analyze` on servihub-api, which asks Groq
(`llama-3.3-70b-versatile`) to read the ticket + linked booking and return
structured JSON graded against `src/config/refundPolicy.js` — the same
numbered policy text (§1 cancellations, §2 no-show = 100%, §3 delay >90min
= 50%, §4 incomplete work = up to 70%, §5 customer-fault = 0%, §6 7-day
window) both the AI and a human agent would cite.

- **`hooks/useTickets.js` → `useAnalyzeTicket(id)`** — a mutation, not a
  query: `POST`s with no body, writes the returned `aiAnalysis` straight
  into the `["tickets", id]` cache via `setQueryData`, then invalidates
  `["tickets"]` broadly so the queue's AI dot (below) picks up the change
  too. Because `GET /tickets/:id` already returns any stored `aiAnalysis`
  (it's a plain schema field, not select-excluded), re-opening a
  previously-analyzed ticket shows the last result with zero extra
  requests — "Analyze" only fires on an explicit click.
- **`CopilotPanel.jsx`** reads `ticket.aiAnalysis` directly off the ticket
  query result instead of a fixture lookup. Loading state is
  `analyzeMutation.isPending` (the Phase 1 skeleton shimmer, now bound to a
  real request); error state is the standard `QueryError` (compact message
  + ghost Retry, per this file's global pattern) rather than a bespoke one.
  `analyzedAt` renders as `relativeTime(...)` in `font-data`, matching every
  other timestamp in this app.
- **Actions are now dynamic**, not two hardcoded buttons: the panel
  iterates `aiAnalysis.suggestedActions` (1-3 of `request_refund` /
  `reassign_provider` / `escalate` / `no_action`; `no_action` renders
  nothing) and renders only what the model actually suggested for *this*
  ticket. Each is wired to a real effect, reusing existing pieces rather
  than inventing new ones:
  - `request_refund` opens **`RequestRefundDialog.jsx`** (new — the
    Phase 1 audit found `RefundDrawer.jsx` only handles approve/reject of
    *existing* refunds; there was no creation UI yet for the already-built
    but unwired `useRequestRefund()` hook). Prefilled with
    `amount = round(booking.amount * refundEligibility.percent / 100)` and
    `reason = refundEligibility.reason`, both editable before submit — an
    agent reviewing AI output isn't forced to accept it verbatim.
  - `reassign_provider` opens the existing `ReassignProviderDialog.jsx`
    (previously only reachable from `BookingDetailPage.jsx`), fed
    candidates via the same `useProviders({ service, limit: 50 })` +
    filter-out-current-provider pattern that page uses, and
    `useReassignBooking(ticket.booking._id)`.
  - `escalate` calls the already-existing `useUpdateTicketPriority(id)`
    mutation directly with `"high"` — no dialog, disables itself once
    `ticket.priority === "high"`.
- **`TicketQueue.jsx`** shows a small `Sparkles` icon next to any ticket
  whose list-endpoint `hasAnalysis` flag is true (a computed
  `$type`-check field added to servihub-api's `LIST_PROJECTION`, since the
  full `aiAnalysis` object was never in the list projection and doesn't
  need to be — the queue only needs the boolean). Icon-as-indicator here
  follows the same precedent as the verified-provider check elsewhere in
  this app; it isn't a status, so it doesn't go through `StatusBadge`.
- **`StatusBadge.jsx`**'s `STATUS_TONE` map dropped the unused `concerned`
  key (a Phase 1 fixture artifact) and gained the real sentiment enum on a
  severity gradient: `calm` → success, `neutral` → info, `frustrated` →
  warning, `angry` → danger.
- **servihub-api side** (for context, since this file only tracks the
  frontend): `src/config/refundPolicy.js` is the shared policy text;
  `src/services/aiAnalysis.service.js` builds the strict JSON-only prompt,
  strips accidental code fences, `JSON.parse`s in a `try/catch`, validates
  the parsed object against a zod schema (sentiment enum, 0-100 percent
  range, 1-3-item action array), and retries **once** with an appended
  correction message on any failure before giving up; the controller turns
  a double-failure into a clean `502` and never persists or returns
  unvalidated AI output. The route is
  `POST /tickets/:id/analyze` behind `requirePermission("ticket.read")`
  plus a **per-user** (not per-IP) rate limit — 10/min, `keyGenerator:
  (req) => req.user.userId`, since agents can share an office IP and
  shouldn't throttle each other.
- **Verified against real Groq calls, not mocked:** analyzing seeded
  tickets TK-107 ("Technician showed up 2 hours late") returned
  `eligible: true, percent: 50, reason: "Per Section 3, provider delay
  beyond 90 minutes"`; TK-106 ("Reschedule next cleaning visit") returned
  `eligible: false, percent: 0` citing it as a scheduling request, not a
  policy section; TK-108 ("AC still not cooling properly") and TK-113
  ("Ants still present after treatment") both returned `percent: 70`
  citing Section 4 incomplete work. All three/four verdicts matched their
  policy sections exactly. A direct call to `analyzeTicketWithAI` (bypassing
  the HTTP layer, since the endpoint deliberately doesn't expose raw model
  text to clients) confirmed the raw Groq response and the zod-parsed
  result were identical for a clean first-try response — no code-fence
  stripping or retry needed in that run, though the retry path exists for
  when one is.
