# App-Building Toolkit & Playbook

When you ask me to **build a web app or app**, this is the equipped toolchain and the
default approach I follow. You give the idea; I research, scaffold, install the
per-project stack, implement, and verify.

## Ready tools (installed, session-wide)

### MCP servers — *restart Claude Code to load their tool access into a session*
| MCP | What it gives me |
|---|---|
| **context7** | Live, version-correct docs for any library (React, Next, Tailwind, Prisma, three.js, recharts…) — stops API hallucination |
| **playwright** | Drive a real browser: e2e tests, **screenshots**, **accessibility-tree** checks, visual verification |
| **shadcn** | Search + add shadcn/ui components (React + Tailwind + Radix) |
| **claude-flow** | Multi-agent orchestration |

### Skills (already installed)
- **ui-ux-pro-max** — design intelligence (50+ styles, 161 palettes, font pairings, 99 UX rules, charts)
- **framer-motion** — production animation patterns · **deep-research** — cited research harness
- **design / design-system / ui-styling / brandkit / stitch / taste / redesign / banner** — visual + brand

### Quality (configured in this repo)
- **ESLint** (flat config) + **Prettier** → `npm run lint` / `npm run format`
- **TypeScript** strict typecheck (client + server) · **.vscode** extension recommendations

## Default production stacks (I pick per project)
| Project type | Stack |
|---|---|
| **Full-stack web app** | React + Vite + TS · React Router · TanStack Query · shadcn/ui + Tailwind · Express/Fastify + Prisma (SQLite→Postgres) · Zod |
| **Marketing / landing** | React + Vite + Tailwind + framer-motion (+ three.js/r3f for cinematic) |
| **API only** | Express/Fastify + Prisma + Zod + JWT/cookie auth + rate-limit + compression |
| **Mobile** | React Native / Expo (or Capacitor to wrap a web app) |

*(This app — people-management — is React+Vite+Express+Prisma; I match its conventions when extending it.)*

## Cross-cutting defaults I bake into every build
- **Auth/security:** bcrypt(12), JWT or httpOnly-cookie, RBAC, rate-limiting, server-side Zod validation, input caps, security headers
- **Accessibility:** WCAG 2.2 AA — visible labels, focus management, color-independent status, `prefers-reduced-motion`, accessible tables/charts
- **Performance:** route code-splitting, gzip compression, request caching, no continuous GPU on data screens, image optimization
- **DX:** ESLint + Prettier, `.vscode` recommendations, typecheck + build gates
- **"Done" = verified:** `tsc` + build pass + Playwright screenshot/a11y check + adversarial review

## Components installed **per-project** (kept out of the global env so each app stays lean)
- **UI:** tailwindcss, shadcn/ui (Radix), framer-motion, lucide-react, recharts
- **Data:** @tanstack/react-query, zod, axios
- **Backend:** express/fastify, prisma, jsonwebtoken, bcrypt, compression, helmet, express-rate-limit
- **Test:** vitest, @testing-library/react, @playwright/test
- **3D (cinematic only):** three, @react-three/fiber, @react-three/drei, @react-three/postprocessing

## How to kick one off
Say: **"build a `<type>` for `<purpose>` with `<features>`."**
I'll: research best UI/UX → choose the stack → scaffold → install deps → implement → verify (tsc/build/Playwright) → adversarial review → report.
