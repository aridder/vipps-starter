# CLAUDE.md

Instructions for Claude Code in this repo. **Read `AGENTS.md` first** — it has
the architecture map, conventions, and recipes. This file adds Claude-specific
workflow notes.

## Start of session

The `SessionStart` hook runs `scripts/setup.sh` automatically (installs deps,
generates the Prisma client, migrates + seeds if a DB is reachable). You should
not need to set anything up by hand. If the hook didn't run, run
`npm run setup`.

## The loop (fast → slow)

| When | Command | Why |
|------|---------|-----|
| After every edit | `npm run check` | `tsc --noEmit`, seconds — your main signal |
| Touched components | `npm run lint` | React/Next rules |
| Touched UI/flows | `npm run test:e2e` | screenshots in `screenshots/` to *see* it |
| Before commit | `npm run verify` | typecheck + lint + build gate |

Don't full-build on every change; `npm run check` is the tight loop. Read
screenshots after e2e to visually confirm UI work.

## Tools & conventions

- Use the dedicated file tools (Read/Edit/Grep/Glob), not shell `cat`/`sed`.
- Prisma: use the local pinned binary (`npx prisma` resolves it), never a global
  v7. Regenerate the init migration offline with `prisma migrate diff
  --from-empty --to-schema-datamodel prisma/schema.prisma --script`.
- Add API surface as **tRPC procedures**, not REST routes. Gate capability with
  **feature flags** (`src/lib/features.ts`), not hardcoded conditions.
- Payments: status truth always comes from an authenticated Vipps fetch — see
  `docs/VIPPS.md`. Don't trust webhook bodies.

## Guardrails

- **Never commit secrets.** `.env` is gitignored — keep keys there only.
- Don't edit generated output (`.next/`, Prisma client).
- Keep changes scoped; match existing style (2-space, named exports, English
  UI strings).
- Branch for changes; commit/push only when asked.

## Handy references

- `AGENTS.md` — architecture, recipes, guardrails (source of truth)
- `docs/AGENT_WORKFLOW.md` — why the loop is shaped this way
- `docs/VIPPS.md` — payments, subscriptions, partner onboarding, webhooks
- `README.md` — setup and stack overview
