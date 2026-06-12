# Product

## Register

product

## Users

Company staff using an internal HR system: ADMIN, HR, MANAGER, and EMPLOYEE roles. They are at work, mid-task — checking a profile, logging a review, scanning headcount — usually several times a day. Salary data lives here, so trust and discretion matter more than spectacle.

## Product Purpose

PeopleHub centralizes people operations: employee directory, profiles (history, promotions, salary, reviews, metrics, career, financial, goals), performance monitoring, and department management, with role-gated access. Success: staff find and record people data quickly, with zero confusion about what they can see or edit.

## Brand Personality

Calm, warm, editorial. Confidence through restraint: serif display type and warm ivory surfaces signal care; the interface itself stays quiet and fast. Three words: calm, precise, humane.

## Anti-references

- The 2023–24 "AI gradient" look: purple/cyan neon, glassmorphism, glowing orbs, WebGL hero scenes (the app was migrated OFF this).
- Generic admin-template dashboards (Bootstrap-admin density with no hierarchy).
- Playful/bouncy consumer motion (elastic easings, confetti) — wrong for salary data.

## Design Principles

1. **One system everywhere** — landing, login, and app share the same warm-editorial tokens (`client/src/styles.css`); no surface gets its own palette.
2. **Meaning over decoration** — status colors are semantic (sage/ochre/clay/slate/plum), charts use the same ramp, motion conveys state only.
3. **Fast is a feature** — interactions in flow stay under ~250ms; high-frequency actions (nav, tabs, table rows) get minimal or no motion.
4. **Editorial hierarchy** — Fraunces for page titles and KPI numerals, Hanken Grotesk for UI, JetBrains Mono for data labels; hairline-divided KPI bands over card grids.
5. **Quietly accessible** — visible accent focus rings, ≥4.5:1 contrast, `prefers-reduced-motion` respected globally.

## Accessibility & Inclusion

WCAG AA: contrast ≥4.5:1 for body text, visible keyboard focus indicators, labeled inputs, reduced-motion alternatives for all animation, status conveyed by dot/shape as well as color.
