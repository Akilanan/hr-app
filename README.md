# PeopleHub — People Management System

A full-stack people-management application: employee **history cards**, **promotion** and **salary-change** tracking, **performance reviews**, **financial** & **career growth**, **learning goals**, and a **performance-monitoring** dashboard. Built to hold and process large datasets, with JWT auth and role-based access.

## Stack

| Layer    | Tech                                                          |
| -------- | ------------------------------------------------------------ |
| Backend  | Node + Express + TypeScript, Prisma ORM                      |
| Database | SQLite (dev) — schema is **PostgreSQL-ready** for production |
| Auth     | JWT + bcrypt, roles: `ADMIN`, `HR`, `MANAGER`, `EMPLOYEE`    |
| Frontend | React + Vite + TypeScript, Recharts                          |

## Prerequisites

- **Node.js 18+** (you have v24 ✓) and npm.

## Quick start

From the project root (`people-management/`):

```bash
npm install            # installs the concurrently runner
npm run setup          # installs server + client deps, creates the DB, seeds demo data
npm run dev            # starts API (http://localhost:4000) + web app (http://localhost:5173)
```

Then open **http://localhost:5173** and sign in with a demo account.

> If you prefer to do it step by step:
> ```bash
> npm --prefix server install
> npm --prefix client install
> npm --prefix server run db:push   # create SQLite schema + generate Prisma client
> npm --prefix server run seed      # load ~16 employees with multi-year history
> npm run dev
> ```

## Demo accounts

All use the password **`demo1234`**:

| Role     | Email              | Can do                                              |
| -------- | ------------------ | --------------------------------------------------- |
| Admin    | admin@demo.com     | Everything — full CRUD on all people & data         |
| HR       | hr@demo.com        | Full people data access                             |
| Manager  | manager@demo.com   | Manage their direct reports (reviews, comp, goals)  |
| Employee | employee@demo.com  | View own record, manage own learning goals          |

## Features

- **History Card** — a unified, filterable activity timeline per employee.
- **Promotions** — title/level progression that updates the employee record.
- **Salary changes** — full compensation change log with % deltas and a trend chart.
- **Performance** — reviews with overall + per-competency ratings; employees acknowledge their own.
- **Financial growth** — yearly base/bonus/equity total-compensation series.
- **Career growth** — milestones (promotions, certifications, awards, projects…).
- **Learning goals** — development goals with status, priority and progress tracking.
- **Performance monitoring** — monthly KPI/OKR time-series, org-wide dashboards & trends.

## Project structure

```
people-management/
├── docs/                   # project documentation (see below)
├── scripts/                # setup / utility scripts
├── server/                 # Express + Prisma API
│   ├── prisma/
│   │   ├── schema.prisma    # data model (Postgres-ready)
│   │   └── seed.ts          # demo-data generator
│   └── src/
│       ├── app.ts, index.ts
│       ├── config/, lib/, middleware/
│       └── modules/         # one router per domain
└── client/                 # React + Vite SPA
    └── src/
        ├── api/, auth/, components/, lib/
        └── pages/           # dashboard, directory, profile (+ tabs), monitoring
```

## Documentation

Detailed docs live in [`docs/`](docs/):

- [`docs/IMPROVEMENTS.md`](docs/IMPROVEMENTS.md) — prioritized audit & improvement log (done + roadmap).
- [`docs/IMMERSIVE_UIUX.md`](docs/IMMERSIVE_UIUX.md) — immersive UI research, design system & build notes.
- [`docs/BUILD_STACK.md`](docs/BUILD_STACK.md) — app-building toolkit & default stacks.

Setup/utility scripts live in [`scripts/`](scripts/).

## Scaling to PostgreSQL (for huge data)

The schema avoids SQLite-only features so the switch is small:

1. Start Postgres (a `docker-compose.yml` is included): `docker compose up -d` (set `POSTGRES_PASSWORD` in a local `.env` first).
2. In `server/prisma/schema.prisma`, set `provider = "postgresql"`.
3. In `server/.env`, set `DATABASE_URL` to your Postgres URL.
4. **Development** — generate the migration: `npm --prefix server run db:migrate` (runs `prisma migrate dev`; it's interactive and writes SQL into `server/prisma/migrations/` — **commit that folder**).
5. **Production** — apply the committed migrations non-interactively: `cd server && npx prisma migrate deploy`. Never run `migrate dev` in production (it can prompt and reset data).

The API already uses pagination, DB indexes on all foreign keys and date columns, and dedicated time-series tables for financial and performance data. At the medium end (10k–50k people) add composite indexes for your hottest queries (e.g. `@@index([departmentId, status])`).

## Production checklist

- Set a strong `JWT_SECRET` (32+ chars) and `CLIENT_ORIGIN` — the server refuses to boot in production without them.
- Tune `JWT_ACCESS_EXPIRES_IN` (short access token, default 15m) and `JWT_REFRESH_EXPIRES_IN` (default 7d). The client refreshes access tokens automatically; `tokenVersion` revokes both on logout/reset.
- Auth endpoints are rate-limited; security headers are sent on every response.
- Demo accounts on the login screen only render in dev (`import.meta.env.DEV`).
- Run `npm --prefix server test` for the RBAC permission + route integration tests.
- Serve the built client (`client/dist`) behind HTTPS; consider moving the JWT to an HttpOnly cookie if you expose the app publicly.

## Useful scripts

| Command (from root)        | Description                          |
| -------------------------- | ------------------------------------ |
| `npm run dev`              | Run API + web app together           |
| `npm run seed`             | Re-seed the database (**wipes all data**, reloads demo) |
| `npm --prefix server run db:backup` | Back up the SQLite DB to a timestamped copy |
| `npm --prefix server run db:studio` | Open Prisma Studio (DB browser) |
| `npm run build`            | Production build of both apps        |
| `npm run lint`             | ESLint (flat config) across client + server |
| `npm run format`           | Prettier-format the source           |
