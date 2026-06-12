# PLAN — Total redesign + update + error-fix (June 2026)

Spec: see `SPEC.md`. Direction locked: **warm editorial premium**, moderate dependency modernization, fix all confirmed audit findings.

## Current-state diagnosis (what's wrong)

- **Four separate token systems**: `styles.css` (monochrome app), `styles/immersive.css` (neon purple/cyan dark layer — the "AI gradient" fingerprint), `styles/dashboard.css` (scoped `--d-*` duplicates), `styles/landing.css` (always-dark purple `.lp`/`.auth`). They visibly clash (purple landing vs. grey app).
- Landing hero is a purple WebGL orb (`#6d5cff`/`#38e0ff` hard-coded) + uppercase gradient display text — generic AI look, heavy bundle (three + R3F + drei + postprocessing ≈ the largest deps in the client).
- Default font is Inter everywhere; statuses were flattened to grey-only (meaning lost); pure-flat surfaces, no texture; numbers fine (tabular) but no display type.

## Design foundation (the one system)

| Token | Light | Dark (warm) |
|---|---|---|
| Canvas | `#FAF8F4` warm ivory | `#141210` warm near-black |
| Surface | `#FFFFFF` / `#FFFDFA` | `#1C1A17` |
| Ink / text | `#1C1917` | `#EDE9E3` |
| Muted / faint | `#57534E` / `#79716B` | `#A8A29B` / `#8A847C` |
| Accent (ONE) | moss `#3E6B4E` (+soft `rgba(62,107,78,.10)`) | sage `#86B498` |
| Status: positive | sage `#3E6B4E` | `#86B498` |
| Status: pending | ochre `#9A6A14` | `#D2A95B` |
| Status: negative | clay `#A8473B` | `#D08A80` |
| Status: info | slate-teal `#3D6378` | `#8FB6C9` |
| Status: special | plum `#6D5A8E` | `#B3A3CF` |
| Border | `rgba(28,25,23,.10)` warm | `rgba(237,233,227,.12)` |
| Shadow | tinted `rgba(58,48,32,.14)` | deep warm black |

- **Type**: `Fraunces` (serif display: page titles, hero, KPI numerals) + `Hanken Grotesk` (UI/body) + `JetBrains Mono` (labels/eyebrows/data tags). Google Fonts, `display=swap`.
- **Texture**: fixed SVG-noise grain overlay (~3–4% opacity), radial warm washes on landing; no flat dead sections.
- **Surfaces**: borders softened, tinted shadows, radius scale (16 container / 10 inner); hairline-divided editorial KPI band stays (it's good).
- **Motion**: existing framer-motion primitives kept; springs on press (`scale .98`), staggered entries; reduced-motion already respected.

## Slices (each with a pass/fail check)

### S1 — Design tokens + fonts (foundation)
- `client/index.html`: fonts preconnect+link, real `<title>` ("PeopleHub — People management"), meta description, `theme-color`, inline SVG favicon (ink "P" on moss).
- `client/src/styles.css`: replace `:root` + `[data-theme='dark']` token blocks with the table above; restore semantic status tones (kill grey-only mapping + non-color badge hacks where now redundant — keep the dot/shape differentiation for a11y); warm chart ramp; grain overlay; serif `h1`; accent focus rings; tinted shadows.
- `client/src/lib/format.ts` `avatarColor`: warm muted swatches; remove `!important` monochrome avatar overrides (styles.css + dashboard.css).
- **Check:** app boots, light+dark screenshots coherent, no grey-only statuses.

### S2 — Kill the neon layer, re-skin app shell + dashboard
- `styles/immersive.css`: delete neon/glass purple system; replace with a small warm-dark ambience file (subtle washes only). Sidebar → warm ink `#1C1917` with ivory text (premium editorial contrast) in light; warm dark equivalent.
- `styles/dashboard.css`: point `--d-*`/`--g*` at global tokens (single source of truth); KPI values + page `h1` in Fraunces; area/bar charts pick up moss-ink.
- **Check:** dashboard screenshot light+dark; zero purple pixels anywhere in app.

### S3 — Landing re-skin (light warm editorial)
- `styles/landing.css`: `.lp` flips to ivory light; serif display (sentence case, no uppercase gradient text); moss accent; warm cards; bento de-uniformed (varied spans/asymmetry); stats/CTA sections restyled; footer simplified.
- `Landing.tsx`: **remove the WebGL HeroScene** (purple orb) → replace with editorial hero: oversized Fraunces display, warm radial washes + grain, product-frame mock (restyled light), sparkline → moss. Copy pass: kill "reimagined" cliché.
- **Check:** landing screenshot — unified with app, no purple, hero readable at 1366×768.

### S4 — Login + auth surfaces
- `.auth` re-skin: warm ink left panel (serif welcome, steps), ivory form side; `ForcePasswordChange.tsx` + `AccountModal`/`AccountAdminModal`/`ConfirmDialog`/`Toast` inherit tokens — verify + tweak.
- **Check:** login + force-change screenshots in both themes; error state styled (clay, not generic red).

### S5 — Data pages polish
- Employees (directory), EmployeeProfile + 9 tabs, Monitoring, Departments: serif page headers, table th styling, badge tones, progress bars (moss), empty states with character.
- **Check:** click through every page; consistent type/spacing; no leftover styles.

### S6 — Dependency updates (moderate — final list comes from the live research agents)
- Likely set (pending confirmation): React 19 + types, Vite latest major + plugin-react, react-router 7 (declarative mode), zod 4, Express 5 + @types, prisma/@prisma/client latest 6.x, axios/date-fns/recharts per advisory findings.
- **Remove** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing` + `client/src/three/*` (dead after S3) — smaller bundle, fewer majors to chase.
- Each upgrade: install → typecheck → run → fix breakages per official migration guide (researched, not guessed).
- **Check:** `npm install` clean, both typechecks green, app runs, build passes.

### S7 — Fix all confirmed audit findings
- The adversarially-verified findings from the background workflow (security / server / client / data / deploy). Will be appended here with file:line + fix per item when the workflow returns.
- **Check:** each fix has evidence (test, repro gone, or config verified); server tests pass.

### S8 — Gates: TEST → SECURITY → VERIFY
- `npm run lint`, both `typecheck`s, `npm run build`, server test suite.
- Security re-check: headers middleware intact, rate limits intact, no secrets in repo, `npm audit`.
- Playwright: login → dashboard → directory → profile (all tabs) → monitoring → departments; console clean; screenshots desktop + 375px mobile; light + dark.
- **Check:** SPEC acceptance sentence satisfied end-to-end.

## Explicitly out of scope
Deploy to Render (separate approval), new features, framework migration, R3F 9 upgrade (stack removed instead).
