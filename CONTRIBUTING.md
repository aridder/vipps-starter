# Contributing

## Prerequisites

- Node 20+
- Docker (for local Postgres) or any Postgres instance

## Setup

```bash
cp .env.example .env          # set AUTH_SECRET + DATABASE_URL (see below)
npm install
npm run db:up                 # starts Postgres on :5432 (docker)
npm run db:reset              # migrate + seed
npm run dev                   # http://localhost:3000
```

For local Postgres via docker, set in `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app
DATABASE_URL_UNPOOLED=postgresql://postgres:postgres@localhost:5432/app
AUTH_SECRET=...               # openssl rand -base64 32
ENABLE_DEV_LOGIN=true
```

Sign in with the dev login (any name + email). The first user becomes
OWNER + ADMIN.

## Development loop

| Command | Use |
|---------|-----|
| `npm run check` | Fast type check (`tsc --noEmit`) — after every edit |
| `npm run lint` | ESLint (Next rules) |
| `npm run test:e2e` | Playwright e2e; screenshots in `screenshots/` |
| `npm run verify` | typecheck + lint + build — run before you commit |
| `npm run db:reset` | Reset DB to seeded state |

See [`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md) for the reasoning and the
AI-agent flow, and [`AGENTS.md`](AGENTS.md) for architecture and conventions.

## Conventions

- Add API as **tRPC procedures** (`src/server/api/routers/*`), not REST.
- Gate optional capability with **feature flags** (`src/lib/features.ts`).
- Keep **secrets in `.env`** only — it is gitignored. Never commit keys.
- Match existing style: 2-space indent, named exports, English UI strings.

## Pull requests

CI runs typecheck, lint, build, and Playwright (against a Postgres service) and
posts the screenshots inline on the PR. Keep changes scoped and green before
requesting review.
