# PeopleHub — Immersive UI/UX: Research, Design System & Build

This document captures (1) the verified UI/UX research that informed the work, (2) the
"immersive next‑gen universe" design direction and how it was implemented, and
(3) the safeguards and follow‑ups. It is the companion to the code shipped in
`client/src/three/`, `client/src/styles/immersive.css`, and the motion/confirm primitives.

---

## 1. Direction & the two‑tier strategy

The brief: *"an immersive website/app with floating holographic interfaces, cinematic
particle simulations, abstract 3D environments… dark cinematic + neon gradients… a
next‑gen digital universe."* Applied **app‑wide**, using **Three.js / react‑three‑fiber**.

Because PeopleHub is a data tool that holds salaries, reviews and PII, the immersion is
delivered as **two tiers of the same universe** so it dazzles *and* stays usable:

- **Tier 1 — "The Universe" (Landing + Login):** full cinematic WebGL — a distorting,
  glowing holographic orb, a layered parallax particle field, and bloom post‑processing.
- **Tier 2 — "The Cockpit" (the app):** the **dark theme is the immersive mode** — a **static,
  GPU‑cheap CSS nebula** behind glassmorphism cards/sidebar/modals, neon accents and a fast
  opacity page‑crossfade — while data stays legible, fast and accessible. The live WebGL
  particle universe is **reserved for the front door** (Tier 1): a continuously‑rendering
  full‑screen canvas behind a data app can't hold 60fps on a 4K display, so the app uses the
  static nebula and **three.js never loads on app routes**. The **light theme** is a clean,
  high‑contrast fallback (untouched by the glass layer).

This mirrors how Linear / Vercel / Stripe ship a cinematic marketing site over a restrained product.

---

## 2. Verified research (deep‑research pass: 30 sources → 141 claims → 21 confirmed)

All claims below survived 3‑vote adversarial verification; sources are primary
(NN/g, W3C WAI‑ARIA APG, Recharts maintainers, Adrian Roselli, GOV.UK, Vercel Geist, Datawrapper).

| # | Verified guidance | Source |
|---|---|---|
| 1 | Encode quantitative values with **length / 2D position** (bar, line, scatter); avoid area/angle (pie/donut) when precise comparison matters. | [NN/g preattentive](https://www.nngroup.com/articles/dashboards-preattentive/), [Datawrapper](https://www.datawrapper.de/blog/chart-types-guide) |
| 2 | **Remove chartjunk**; **label series directly** rather than via a legend (also helps colorblind users). | [NN/g clutter](https://www.nngroup.com/articles/clutter-charts/) |
| 3 | Directory tables must serve **4 core tasks** (find/filter/sort, compare, view‑edit‑add, act on one/many); first column = **human‑readable name**, not an ID. | [NN/g data tables](https://www.nngroup.com/articles/data-tables/) |
| 4 | **Freeze headers** when scrolling; filters must be discoverable with a **clear active‑filter indicator**. | [NN/g data tables](https://www.nngroup.com/articles/data-tables/) |
| 5 | Sortable columns: wrap header text in a **`<button>`**, set **`aria-sort`** on the `<th>` (one column at a time), and add an **ARIA live region** to announce sort changes (VoiceOver/TalkBack don't otherwise). | [W3C APG sortable table](https://www.w3.org/WAI/ARIA/apg/patterns/table/examples/sortable-table/), [Adrian Roselli](https://adrianroselli.com/2021/04/sortable-table-columns.html) |
| 6 | **Empty/no‑match states** must communicate status + offer a path out (e.g. "Clear filters"); never a blank panel. | [NN/g empty states](https://www.nngroup.com/articles/empty-state-interface-design/) |
| 7 | **Color is never the only cue** (WCAG 1.4.1 A) — pair with text/icon/pattern. Critical for a monochrome system. | [W3C use‑of‑color](https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html) |
| 8 | Recharts **`accessibilityLayer`** is **off by default in v2.x** (on in v3) — necessary but **not sufficient** (still need text alternatives). | [Recharts a11y](https://github.com/recharts/recharts/wiki/Recharts-and-accessibility) |

**Refuted (do NOT apply):** "color may never encode magnitude" (over‑broad); "remove all
gradients/shadows/decoration" (the absolutist data‑ink stance is contested); "aria‑sort can
never be on multiple headers"; "accessibilityLayer alone makes charts accessible."

**Open (not yet researched / follow‑up):** timeline/activity‑feed patterns, deep
Framer‑Motion enterprise‑motion specifics, forms/destructive deep‑dive, premium‑typography scale.

`ui-ux-pro-max` engine corroboration: app classified as **"Data‑Dense Dashboard"**; the
existing **Inter** type choice = its recommended "Minimal Swiss" pairing (validated — keep it).

---

## 3. What was built

### Foundation (Phase 0)
- **Deps:** `three`, `@react-three/fiber@8`, `@react-three/drei@9`, `@react-three/postprocessing`, `framer-motion` (pinned to the React‑18‑compatible majors).
- **`client/src/styles/immersive.css`** — neon + glass token layer. Glass surfaces, sidebar,
  modals, inputs, neon buttons/focus, progress/timeline accents — **all scoped to
  `[data-theme='dark']`** so light mode is untouched. Includes `.fx-neon-text`, `.fx-float`,
  `.glass`, the `.btn.danger-solid` destructive style, and a `prefers-reduced-motion` kill‑switch.
- **`client/src/three/`** — `lib.ts` (`usePrefersReducedMotion`, particle generator),
  `Particles.tsx` (drifting additive star layers + pointer parallax), `ImmersiveBackdrop.tsx`
  (global ambient canvas), `HeroScene.tsx` (distort‑material orb + wireframe shell + bloom).
- **`client/src/components/motion.tsx`** — `PageTransition` (route crossfade), `Reveal`, shared easing/variants.
- **`client/src/components/BackdropGate.tsx`** — mounts the backdrop only in dark theme,
  reacts to theme toggles via `MutationObserver`, and **skips the landing/login routes**
  (which run their own richer scene) to avoid a double canvas.

### Front door (Phase 1) & shell (Phase 2)
- `Landing.tsx` + `Login.tsx`: lazy `<HeroScene>` layered behind the hero / auth aside.
- `Layout.tsx`: glass sidebar, `<PageTransition>` wrapping routed pages, global backdrop.
- `theme.ts`: first‑time visitors default to **dark/immersive** (explicit light pref respected).

### Research‑driven a11y guardrails (Phase 3)
- **`ConfirmDialog.tsx`** — accessible, promise‑based `useConfirm()` replacing native
  `confirm()` across **all 7 destructive flows** (departments + 6 profile tabs); reuses the
  focus‑trapped `<Modal>`; Escape/overlay/Cancel resolve false. Destructive action uses a
  semantic danger color.
- Charts: `accessibilityLayer` was trialed but **removed** — in **recharts 2.15** it blanks
  Cartesian charts rendered inside `ResponsiveContainer` (confirmed: the untouched PieCharts
  rendered, the Cartesian charts with the prop did not). Chart accessibility is therefore
  handled via the **"view as table" follow-up** — the *sufficient* solution per research #8.
- Color‑independent status badges and `prefers-reduced-motion` were already present and are preserved.

### Performance & accessibility safeguards (built in)
- Heavy three.js is **code‑split** into a lazy chunk (~221 kB gzip) — it never touches initial
  app load and only loads in dark mode.
- `prefers-reduced-motion` → the r3f scenes render **nothing** (static CSS nebula instead); all CSS motion disabled.
- Glass uses a fairly opaque dark base to keep text contrast ≥ AA over the moving backdrop.
- **4K/high-DPI tuning:** live `backdrop-filter` blur was removed from the many `.card`s and the
  sidebar (replaced with translucent solid glass) — re-sampling + blurring the full WebGL
  backdrop per card per frame was the main jank source on large displays. The ambient particle
  backdrop now renders at **0.75× DPR** with **~halved** particle counts; blur on modals is kept
  (transient) and dropped entirely on mobile.

---

## 4. Verification & review

- `tsc --noEmit` ✅ 0 errors · `vite build` ✅ 2,236 modules · app boots & serves (HTTP 200).
- **Adversarial multi‑agent review** (6 dimensions, 87 agents, every finding 3‑vote verified):
  27 raw → **18 confirmed** (2 of which confirmed the Modal focus‑trap and light‑mode
  isolation are *correct*). **All 16 actionable findings were fixed:**
  - Backdrop now **pauses its frameloop when the tab is hidden**, scales particle density via
    **device‑memory LOD**, and the heavy three.js chunk is **never loaded for reduced‑motion
    users**; bloom is desktop‑only, DPR capped at 1.5, orb poly‑count reduced; mobile drops
    `backdrop-filter` for solid glass.
  - `ConfirmProvider` cancels a previous confirm on **concurrent calls** and **resolves
    pending promises on unmount** (no hangs/leaks); the dialog uses `role="alertdialog"`.
  - Close‑button contrast raised on dark glass; focus ring gains `outline-offset`;
    modal‑overlay z‑index lifted above the drawer; the legacy `.page > *` stagger was removed
    (PageTransition now owns entrance); theme default honors an explicit system *light* preference.
  - Re‑verified after fixes: `tsc` ✅ + `vite build` ✅.
- **Second review pass** (regression‑focused, 15 agents): 4 confirmed → **all fixed**
  (`.modal-overlay` blur + input focus‑glow also dropped on mobile; `settle()` memoized so the
  Modal keydown effect doesn't re‑attach on re‑render; `Avatar` always has an `aria-label`).
  Core logic (hook order, frameloop resume, ConfirmProvider concurrency, the hook split) was
  verified **regression‑free**. Re‑verified: `tsc` ✅ + `vite build` ✅.

---

## 5. Follow‑ups (high‑value, not yet implemented)

1. **Accessible sortable directory table** — `<button>`‑wrapped headers + `aria-sort` + live
   region, wired to the API `sort` param (research #5). Needs server sort‑key confirmation.
2. **Chart text alternatives / "view as table"** — `accessibilityLayer` is necessary but not
   sufficient (research #8); add a per‑chart visually‑hidden summary or table toggle.
3. **Active‑filter indicator + "clear filters"** on the directory empty state (research #4, #6).
4. **Optional:** a user‑facing "reduce effects / quality" toggle (LOD is already automatic via
   device memory; backdrop already pauses when hidden and bails under reduced‑motion).
