# Getting started — spin up a new app from this template

Step-by-step for turning this template into a new product.

## 1. Create your repo

On GitHub, click **Use this template → Create a new repository** (this repo must
be marked as a template under Settings → Template repository). Then clone it.

## 2. Provision a database

Either is fine:

- **Local (docker):** `npm run db:up` starts Postgres on `:5432`.
- **Hosted (Neon/Supabase/…):** create a Postgres database and copy the pooled
  and direct connection strings.

## 3. Configure environment

```bash
cp .env.example .env
```

Minimum to boot:

```
NEXT_PUBLIC_APP_NAME="Your App"
DATABASE_URL=...              # pooled
DATABASE_URL_UNPOOLED=...     # direct (for migrations)
AUTH_SECRET=...               # openssl rand -base64 32
ENABLE_DEV_LOGIN=true         # dev/demo login; turn off in prod
ADMIN_EMAILS=you@example.com  # optional: these become ADMIN on login
```

For local docker Postgres both URLs are
`postgresql://postgres:postgres@localhost:5432/app`.

## 4. Install, migrate, run

```bash
npm install
npm run db:reset             # apply migrations + seed the default org
npm run dev                  # http://localhost:3000
```

Sign in with the dev login (any name + email). The **first user becomes
OWNER + ADMIN**.

## 5. Choose your feature flags

Toggle in `.env` (defaults in `src/lib/features.ts`):

```
FEATURE_MULTI_TENANT=true    # org switcher + members
FEATURE_PAYMENTS=true        # Vipps one-off payments
FEATURE_RECURRING=true       # Vipps subscriptions
FEATURE_PAYMENT_ADMIN=false  # admin console: refunds, reserve/capture (off by default)
FEATURE_EMAIL=false          # notification channels
FEATURE_SMS=false
FEATURE_PUSH=false
```

Single-tenant app? Set `FEATURE_MULTI_TENANT=false` — the org layer stays in the
schema but the UI stops exposing members/switching.

## 6. Wire Vipps (optional)

Add test keys (`apitest.vipps.no`) to `.env`, then in the app go to
**Settings → Vipps connection → Connect**. See
[`VIPPS.md`](VIPPS.md) for keys, subscriptions, and the partner/super-merchant
model where each tenant bills to its own MSN.

## 7. Wire notifications (optional)

`src/server/notify/{email,sms,push}.ts` are stubs that log until you add
credentials. Fill in the provider call (see the `TODO`s) and set the matching
env vars, then flip `FEATURE_EMAIL` / `_SMS` / `_PUSH`.

## 8. Make it yours

- Set the `NEXT_PUBLIC_*` branding env (see `src/lib/site.ts`) and replace
  `src/components/Logo.tsx`, `src/app/icon.svg`, `apple-icon.png`.
- Build your domain as tRPC routers + pages (see recipes in
  [`../AGENTS.md`](../AGENTS.md)).

## 9. Deploy to Vercel

1. Import the repo in Vercel.
2. Add a Postgres integration (e.g. Neon) — it sets `DATABASE_URL(_UNPOOLED)`.
3. Set env vars: `AUTH_SECRET`, `NEXT_PUBLIC_APP_NAME`, Vipps keys (if used),
   `CRON_SECRET` (for the subscription cron), notification keys, and
   `ENABLE_DEV_LOGIN=false` for production.
4. The build runs `prisma migrate deploy` automatically (see `vercel.json`), and
   the daily charge cron is already configured.

## 10. Development loop

See [`AGENT_WORKFLOW.md`](AGENT_WORKFLOW.md): `npm run check` after every edit,
`npm run test:e2e` for screenshots, `npm run verify` before committing. CI posts
screenshots inline on every PR.
