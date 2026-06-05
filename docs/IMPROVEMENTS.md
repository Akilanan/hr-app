# PeopleHub — Improvement Plan

Generated from a deep 6-perspective audit (security, backend correctness/data, frontend logic, UI/UX & accessibility, performance, architecture/testing). Items are prioritized **P0** (critical), **P1** (important), **P2** (nice-to-have). Status: ✅ done · 🟡 intentionally deferred (a P2 optimization not needed at the current scale).

## Done — first pass (code-only, no new deps, no DB migration)

### Accessibility (most were regressions from the monochrome redesign)
- ✅ **Status badges distinguishable without color** — each status now differs by fill/outline/dot treatment, not near-identical greys (was a P0: Active/On-leave/Terminated looked identical).
- ✅ **Modal is accessible** — `role="dialog"`, `aria-modal`, `aria-labelledby`, Escape-to-close, focus moved in on open + restored on close, focus trap, body scroll lock. Covers all ~10 dialogs (one shared component).
- ✅ **Visible focus indicator** — global `:focus-visible` ring on every interactive element (was missing everywhere except inputs).
- ✅ **Mobile navigation** — hamburger top bar + off-canvas drawer below 720px (app was previously unusable on phones: sidebar `display:none` with no replacement).
- ✅ **Keyboard-operable interactions** — profile tabs are a real `role="tablist"` of buttons with arrow-key nav; directory rows are keyboard-activatable; login demo pills are buttons.
- ✅ **Accessible names** — `aria-label` on icon-only delete buttons and filter/search controls; `alt` on avatars.
- ✅ **Error banners announced** — `role="alert"` + visually distinct from neutral/info.

### Backend correctness & data integrity
- ✅ **Salary-change delete no longer corrupts `currentSalary`** (P0) — delete now recomputes the employee's salary from the latest remaining non-bonus change inside a transaction.
- ✅ **Promotion delete reverts title/level** (P0) — same drift bug fixed for job title/level.
- ✅ **BONUS rows store sane data** (P1) — `percentChange = 0`, previous = new = amount, instead of a misleading "−92% pay cut".
- ✅ **Rating-distribution bands are unambiguous** (P1) — half-open ranges so a 4.5 lands in exactly one band matching its label.
- ✅ **Financial-growth total is validated** (P1) — server rejects a `totalCompensation` that doesn't equal base+bonus+equity (or derives it).
- ✅ **Admin password-reset is rate-limited + audited** (P1) — `authLimiter` applied; a history event records who reset whom.

### Frontend correctness & polish
- ✅ **`useFetch` race fixed** (P0) — stale/out-of-order responses are ignored (staleness guard), so fast typing/paging can't render the wrong results; also no setState after unmount.
- ✅ **No more full-table blanking on refetch** (P1) — lists keep content mounted and show a subtle refetch indicator; full spinner only on first load (`isInitialLoading`).
- ✅ **Money/percent formatters guard NaN** (P2) — cleared numeric fields no longer render "₹NaN" / "+NaN%".
- ✅ **Profile tabs lazy-loaded** (P0 perf) — the 422 kB recharts chunk now downloads only when a chart tab is opened; the profile landing chunk dropped **46 kB → 8 kB** (verified in the production build).

### Security (cheap, high-value)
- ✅ **bcrypt cost raised 10 → 12** (P2) — OWASP-aligned for an HR/salary store.
- ✅ **Weak/short/fallback JWT-secret warning at startup** (P1 hardening) — logs loudly if the dev fallback or a short secret is in use outside production.

---

## Done — second pass (formerly the roadmap)

### Dependencies, tests & CI
- ✅ **HTTP compression** (P0 perf) — `app.use(compression())` wired in `app.ts`; 3–10× smaller API payloads.
- ✅ **Test suite** (P1) — dependency-free, run with `npm --prefix server test`: `permissions.test.ts` (unit tests of the RBAC logic) **and** `integration.test.ts` (route-level tests over real HTTP against a throwaway SQLite DB — login, refresh, RBAC 401/403, acknowledge-only review, manager-strip, token revocation, persistence).
- ✅ **ESLint + Prettier + CI** (P2) — flat ESLint config (`eslint.config.mjs`), Prettier (`.prettierrc.json` + `npm run format` / `format:check`), and GitHub Actions CI (`.github/workflows/ci.yml`): install → `prisma generate` → lint → typecheck (server + client) → test → build on every push/PR to `main`.

### Security
- ✅ **JWT revocation + short access tokens with refresh** (P1) — `User.tokenVersion` is embedded as `tv` in both token types; `requireAuth` re-checks `isActive` **and** `tokenVersion` on every request. Access tokens are short-lived (`JWT_ACCESS_EXPIRES_IN`, default 15m) and the client silently exchanges a long-lived refresh token at `/auth/refresh`; logout / password change / admin reset bump `tokenVersion`, invalidating every live access **and** refresh token immediately.

### Frontend / UX
- ✅ **Sortable, page-sized tables** (P1) — clickable directory headers with `aria-sort` wired to the API `sort` param, a live "sorted by …" announcement, and an "N–M of T" range with prev/next paging.
- ✅ **Charts: text alternative** (P1 a11y) — every chart container is `role="img"` with a descriptive summary (hiring trend, headcount, donuts, KPI trend, rating distribution, salary, financial, metrics); the salary and financial charts also render a full data table beneath them.
- ✅ **Reusable ConfirmDialog** (P1 UX) — promise-based `useConfirm()` + `<ConfirmProvider>` (accessible `alertdialog` reusing the focus-trapped `<Modal>`) replaces native `confirm()`/`alert()` everywhere; an explicit guardrail confirms status → **TERMINATED**.
- ✅ **Bonus amount field** (P1) — the salary form relabels its amount input to "Bonus amount" for a BONUS, and the server records bonuses without moving base salary.
- ✅ **Aggregated overview endpoint** (P1 perf) — `GET /employees/:id/overview` collapses the profile fan-out (summary + financial growth + reviews + salary changes) into a single round-trip.

### Backend / architecture
- ✅ **Timezone/UTC normalization** (P1) — all dashboard month bucketing uses `getUTC*` / `Date.UTC`, so points no longer shift a month/year off-UTC.
- ✅ **Currency mixing in org totals** (P1) — the dashboard aggregates compensation **per currency** (`groupBy: ['currency']`), reports totals for the primary (most-common) currency, and sets a `mixedCurrencies` flag the client surfaces.
- ✅ **Input length caps + URL validation** (P2) — `.max()` on every free-text Zod field; `avatarUrl` is validated as an http(s) URL (or empty), blocking `javascript:`/`data:` URIs.
- ✅ **Single source of types/enums** (P2) — `server/src/lib/enums.ts` and `client/src/lib/enums.ts` are the canonical lists. Every server route validator (`z.enum(EMPLOYEE_STATUSES | EMPLOYMENT_TYPES | REVIEW_STATUSES | SALARY_CHANGE_TYPES | ROLES | LEARNING_* | PRIORITIES | METRIC_TYPES | CAREER_MILESTONE_TYPES)`) and every client dropdown now derives from them; client `Role` is derived from `ROLES`.
- ✅ **CSV import: transactional + strict** (P2) — per-row Zod validation, a transaction per created row (employee + HIRED history event), and a structured per-row error report.
- ✅ **Standard response envelope** (P2) — list/detail responses use `{ data }` / `{ data, pagination }` consistently.

---

## Remaining — intentionally deferred (P2 optimizations, not needed at the current scale)

- 🟡 **Shared client request cache** — the aggregated `/employees/:id/overview` endpoint already removes the profile tab fan-out; a global URL/TanStack-Query cache to dedupe other repeat fetches is still optional.
- 🟡 **Generic `ownedResource` factory** — largely addressed: the `getEmployeeOr404` loader plus `canView`/`canManage`/`assertPermission` are applied uniformly across all sub-resource routes. A single generic loader could remove the last bit of `findUnique → 404 → permission` boilerplate in the sub-resource DELETE/PATCH handlers.
- 🟡 **Streamed CSV export** — export is currently built in memory, which is fine for the present dataset; switch to a streamed response for very large orgs.
- 🟡 **Paginate sub-resource lists** — per-employee lists (salary changes, reviews, goals, metrics…) return in full; add pagination only if a single employee accumulates thousands of rows.

> The remaining items are scale optimizations, not correctness, security, or accessibility gaps — the app builds, type-checks, lints, tests, and bundles cleanly as-is.

---

## IDE diagnostics (Microsoft Edge Tools / webhint) — `.hintrc`

The **Edge Tools** VS Code extension runs `webhint` over open files and reported ~149
items that are **not** defects in this codebase:

- **`axe/forms` (label / select-name)** — webhint is a *static* analyzer and can't see
  that the shared [`<Field>`](../client/src/components/ui.tsx) component wraps every control
  in a real `<label>`, so it false-flags labelled inputs. (Genuinely unlabelled controls —
  the review competency sliders — were given an `aria-label`.)
- **`axe/aria`** — `role={role}`, `aria-selected={active}`, `aria-sort={…}` are dynamic
  expressions the static checker can't evaluate; they resolve to valid values at runtime.
- **`no-inline-styles`** — the app intentionally uses `style={{…}}` for one-off layout.
- **`button-type`** — modal buttons render outside their `<form>`, so there's no accidental-submit risk.

These four hint groups are turned off in [`.hintrc`](../.hintrc). The project's real quality
gate — ESLint, `tsc`, the test suites and the production build — stays green and is unaffected.
(The lone Prisma `url` advisory on `schema.prisma` is a forward-compat notice for Prisma 7;
it does not apply to the installed Prisma 6, where `url` in the datasource is required.)
