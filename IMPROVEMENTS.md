# PeopleHub — Improvement Plan

Generated from a deep 6-perspective audit (security, backend correctness/data, frontend logic, UI/UX & accessibility, performance, architecture/testing). Items are prioritized **P0** (critical), **P1** (important), **P2** (nice-to-have). Status: ✅ done this pass · 🟡 roadmap (needs a dependency install, DB migration, or larger refactor).

## Done this pass (code-only, no new deps, no DB migration)

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

### Security (cheap, high-value)
- ✅ **bcrypt cost raised 10 → 12** (P2) — OWASP-aligned for an HR/salary store.
- ✅ **Weak/short/fallback JWT-secret warning at startup** (P1 hardening) — logs loudly if the dev fallback or a short secret is in use outside production.

---

## Roadmap (blocked on deps / DB migration / larger work)

### Blocked by offline npm (network blocks installs — see memory: Fortinet SSL)
- 🟡 **HTTP compression** (P0 perf) — `app.use(compression())`; needs the `compression` package. 3–10× smaller API payloads.
- 🟡 **Route/RBAC test suite** (P1) — supertest + vitest against `createApp()` on a temp SQLite DB (401/403, acknowledge-only review, PATCH manager-strip, CSV import). Needs `vitest`+`supertest`.
- 🟡 **ESLint + Prettier + CI** (P2) — the `eslint-disable` comments are currently inert (no ESLint config/dep).

### Needs a Prisma migration (`db push`) — do when the server isn't under concurrent use
- 🟡 **JWT revocation** (P1 security) — add `User.tokenVersion Int`, embed in the JWT, verify + check `isActive` on every request, bump on password-change/reset/deactivation; shorten TTL from 7d and add refresh. Today logout/reset/deactivation do NOT invalidate live 7-day tokens.

### Larger frontend/UX work
- 🟡 **Lazy-load profile tabs** (P0 perf) — recharts is 422 kB and currently loads on the employee's default landing (their profile). `lazy()` per tab so only the active tab pulls charts. *(Partially addressed — see notes; full split is roadmap.)*
- 🟡 **Sortable, page-sized tables** (P1) — clickable sort headers (`aria-sort`) wired to the API's `sort` param; page-size selector; "1–12 of N".
- 🟡 **Charts: text alternative** (P1 a11y) — `role="img"`+summary or a "view as table" toggle for dashboard/profile charts.
- 🟡 **Reusable ConfirmDialog** (P1 UX) — replace native `confirm()/alert()`; add a guardrail when status → TERMINATED.
- 🟡 **Bonus amount field** (P1) — dedicated input so a bonus captures its amount instead of a no-op row.
- 🟡 **Shared request cache** (P1 perf) — TanStack Query / small URL cache to stop refetching the same data across profile tabs; an aggregated `/employees/:id/overview` endpoint to collapse the 5-request fan-out.

### Backend / architecture
- 🟡 **Timezone/UTC normalization** (P1) — date-only inputs vs local-time month bucketing place points in the wrong month/year off-UTC.
- 🟡 **Currency mixing in org totals** (P1) — dashboard sums mixed currencies as ₹; enforce one org currency or aggregate per-currency.
- 🟡 **Input length caps + URL validation** (P2) — `.max()` on free-text zod strings; `avatarUrl` as http(s) URL; validate `reviewerId`.
- 🟡 **`ownedResource` factory** (P2) — the find/404/permission scaffold is duplicated ~15×; extract to remove the chance of missing a check.
- 🟡 **Single source of types/enums** (P2) — `Role`/status/employmentType are declared 3× across client/server; derive from one place.
- 🟡 **CSV import: transactional + strict** (P2), **streamed CSV export** (P2), **standard response envelope + paginate sub-resource lists** (P2).
