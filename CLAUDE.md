# CLAUDE.md

Canonical guidance for AI coding agents in this repo — whichever tool you use. Optimized
for a **fast edit → verify loop**. `AGENTS.md` is only a pointer here.

Portfolio context: `~/Projects/portefolje/app-plattform.md`.

## The fast loop (do this)

Prefer the **smallest reliable signal first**, escalate only as needed:

1. **Edit** code.
2. `npm run check` — `tsc --noEmit`, a few seconds incremental. This is your
   primary signal after every change; it catches most errors fastest.
3. `npm run lint` — React/Next lint when you touched components.
4. **UI changes** → `npm run test:e2e`. Playwright writes screenshots to
   `screenshots/` so you can *see* the result without a human.
5. `npm run verify` — full gate (typecheck + lint + build) **before committing**.

Avoid running full `npm run build` on every edit — it's ~10s; `npm run check`
is the tight loop. The `SessionStart` hook (`scripts/setup.sh`) pre-installs
deps, generates the Prisma client, and migrates/seeds, so you never wait on
setup mid-task.

## Local database

```bash
npm run db:up        # docker compose postgres on :5432
npm run db:reset     # migrate reset + seed → known-good state
npm run db:studio    # inspect
```

Set `DATABASE_URL` / `DATABASE_URL_UNPOOLED` to the local URL in `.env`
(see `.env.example`). The seed creates the default org; the first user to log in
becomes OWNER + ADMIN.

## Architecture map

```
src/
  app/                 Next.js App Router pages (all client components use `api`)
    api/
      trpc/…           tRPC HTTP handler
      vipps/webhook/   Vipps webhook (ePayment + recurring), HMAC-checked
      cron/charges/    daily subscription renewal (CRON_SECRET-protected)
  server/
    auth.ts            Auth.js: Vipps Login (OIDC) + dev login
    db.ts              Prisma client singleton
    vipps.ts           ePayment + shared token/headers/MSN
    vipps-recurring.ts Recurring agreements + charges
    vipps-webhooks.ts  webhook register/delete + signature verify
    payments.ts        authoritative payment status sync
    agreements.ts      subscription status sync + charge cron engine
    notify/            in-app + email/sms/push (providers are stubs)
    api/
      trpc.ts          context (orgId, roles), procedures (public/protected/admin)
      root.ts          router registry
      routers/         meta, org, payment, subscription, notification
  lib/
    features.ts        feature flags (env-driven)
    labels.ts          enum → UI label maps
```

Data model (`prisma/schema.prisma`): `User`, `Organization`, `Membership`,
`Payment`, `Agreement` + `AgreementCharge`, `Notification`, `PushSubscription`.
One `0_init` migration.

## Conventions

- **tRPC everywhere.** Client calls `api.<router>.<proc>` from
  `@/trpc/react`. There is no separate REST layer. Add a procedure, not a route.
- **Procedures:** `publicProcedure`, `protectedProcedure` (adds `ctx.userId`),
  `adminProcedure` (ADMIN/OWNER on the active org). Active tenant is `ctx.orgId`.
- **Feature flags** gate capability. Read on the server with `isEnabled(name)`;
  the client reads `api.meta.features`. Don't hardcode; add a flag.
- **Payments truth** always comes from an authenticated Vipps fetch
  (`syncPaymentStatus` / `syncAgreementStatus`). Webhooks/return URLs are only
  triggers. Never mark something paid from webhook input alone.
- **Prisma version:** use the local binary (`./node_modules/.bin/prisma` or
  `npx prisma`) — the pinned v6, not a global v7. To regenerate an init
  migration offline: `prisma migrate diff --from-empty --to-schema-datamodel
  prisma/schema.prisma --script`.
- Match surrounding style: 2-space indent, named exports, English UI strings.
- Use the dedicated file tools (Read/Edit/Grep/Glob), not shell `cat`/`sed`.
- Branch for changes; commit/push only when asked.

## Adding things (recipes)

- **A new API procedure:** add to the relevant `routers/*.ts`; if it's a new
  area, create a router and register it in `root.ts`.
- **A new page:** `src/app/<name>/page.tsx`, `"use client"`, call `api.*`. Add a
  link in `src/components/Nav.tsx` (gate by flag/role via `l.show`).
- **A new model:** edit `schema.prisma`, then create a migration and
  `npx prisma generate`. Keep relations optional where a tenant may be absent.
- **Rebranding the landing page:** edit the runtime branding env vars
  (`APP_NAME`, `SITE_TAGLINE`, `GITHUB_URL`, `AUTHOR_*`, `CONTACT_EMAIL`; see
  `src/lib/site.ts`).

## Guardrails (don't)

- **Never commit secrets.** `.env` is gitignored; keep it that way. Vipps keys,
  `AUTH_SECRET`, `CRON_SECRET`, provider keys live in env only.
- Don't add a REST endpoint when a tRPC procedure fits.
- Don't bypass the authoritative status sync for payments.
- Don't disable the webhook signature check to "make it work" — it's WARN mode
  by default and can't block the flow (see `docs/VIPPS.md`).
- Don't hand-edit generated files (`.next/`, Prisma client).

## Testing & CI

- E2E: `npm run test:e2e` (Playwright starts the app). Screenshots land in
  `screenshots/`.
- CI (`.github/workflows/ci.yml`): typecheck + lint + build, then Playwright
  against a Postgres service; screenshots are posted **inline** on the PR.

## Vipps

Full flow, keys, partner onboarding and webhook signatures: `docs/VIPPS.md`.
Test keys work against `apitest.vipps.no`; partner keys only work in prod.

## Handy references

- `docs/VIPPS.md` — payments, subscriptions, partner onboarding, webhooks
- `README.md` — setup and stack overview
