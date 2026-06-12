# SPEC — Total redesign + update + error-fix pass (June 2026)

## What

One pass over the existing **people-management** app (Vite + React client, Express + Prisma server, deployed on Render) that delivers:

1. **Total redesign** — unify the currently-clashing design systems (monochrome editorial app vs. purple-dark landing/login) under ONE aesthetic: **warm editorial premium**.
2. **Dependency update** — moderate modernization: take majors with clear payoff confirmed by live research (June 2026 sources), skip churn-only upgrades.
3. **Error fixes** — fix **every** finding confirmed by the adversarial multi-agent audit (security, correctness, data layer, build/deploy).

## Users

Company staff using it as the internal HR system: `ADMIN`, `HR`, `MANAGER`, `USER` roles. Salary data lives here — security findings are never deferred.

## Design direction (decided)

- **Canvas:** warm ivory/paper (`~#FAF9F6`), warm ink text (stone family) — no pure black/white.
- **Type:** serif display for headlines + clean humanist sans for UI; tabular/mono figures for data.
- **Accent:** ONE — deep moss green (`~#3D6B4F` family), desaturated. No purple, no AI gradients.
- **Surfaces:** soft warm cards, tinted (not grey) shadows, subtle grain; varied radii.
- **Status colors:** restored but muted/warm (sage / ochre / clay) — meaning survives without screaming.
- **Dark mode:** warm dark (stone, not blue-black), same accent, designed together with light.
- **Motion:** framer-motion springs, staggered entries, 150–300 ms micro-interactions, reduced-motion respected.
- Landing + login + app all read as one product.

## Core journeys (must keep working)

1. Landing → Sign in → Dashboard (role-gated).
2. Directory → Employee profile → all 9 tabs (Overview, History, Promotions, Salary, Reviews, Metrics, Career, Financial, Goals).
3. Performance monitoring page; Departments CRUD (ADMIN/HR).
4. Account modal, force-password-change flow, admin account management, theme toggle.

## Non-goals

- No framework migration (stays Vite + React + Express + Prisma + Render).
- No new product features.
- No deploy without explicit approval (deploy is a pause point).
- No paid services.

## Success criteria (measurable)

- `npm run lint`, both `typecheck`s, and `npm run build` all green.
- Every **confirmed** audit finding has a fix (commit references the finding).
- Updated dependency set installs clean (`npm install` no errors) and the app runs against it.
- Playwright click-through of journeys 1–3 passes with **zero console errors**.
- Landing, login, and app screenshots show one unified warm-editorial system (no purple, no clashing accents).
- Accessibility held: focus rings, labels, contrast ≥ 4.5:1, reduced-motion still respected.

## Acceptance check (the one sentence)

**Done when** build + typecheck + lint are green, all confirmed audit findings are fixed, the modernized dependencies install and run, and a real-browser click-through of login → dashboard → directory → profile → monitoring shows the unified warm-editorial design with zero console errors.
