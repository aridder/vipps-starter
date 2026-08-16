# Vipps Starter repository guide

This is the canonical repository guide for humans, Codex, and Claude Code.
Read it before changing behavior. `AGENTS.md` is intentionally only a pointer
to this file.

## Developer experience

A pragmatic and extremely efficient developer experience is one of this
repository's top priorities, ranked with security and data policy rather than
below them. Feedback latency decides how much correct work gets shipped per
hour, by a human and by an agent, so treat the loop as a product surface:

- One command from a clean checkout: `./scripts/dev setup`. It is idempotent
  and safe to repeat on a warm machine.
- One entry point: `./scripts/dev`. Never add a second setup path, a competing
  README recipe, or a manual step a script could do.
- The normal loop stays fast: a targeted test in seconds, `./scripts/dev check`
  as the whole-repository loop. `verify`, integration, and e2e run last, never
  in the inner loop.
- The normal loop runs offline: no cloud sign-in, no production secret, no
  hand-provisioned service.
- `./scripts/dev doctor` answers which runtime and services are active.
- Failures state what to run next. An error message that ends the conversation
  is a defect.
- Friction is a bug. When setup, a gate, or a message wastes your time, fix it
  in the same pull request while it is small and open an issue when it is not.
  Leave the loop faster than you found it.

Run `./scripts/dev friction` before you start a feature. Every `./scripts/dev`
run records its action, exit status, and duration in `.cache/devex/loop.jsonl`
(local, never committed), and the report reads that window plus this
repository's own profiles. It answers two questions:

- **Which signals do I have?** A feature that touches the database in an app
  with no integration profile, or the UI in an app with no visual profile, has
  no proof except somebody clicking. The report says so before you write the
  code, not in review.
- **Where is the loop slow or flaky?** Median, tail, and failure rate per
  action against a declared budget. Over budget or failing a third of the time
  is a finding, and findings are issues — the `Friksjon i utviklingsløkken`
  template exists for exactly this.

Budgets live in `scripts/devex-report.mjs` and can be overridden per repository
with `devex.budgets` in `package.json`. Change a budget in the open when you
disagree with it; do not quietly live over it.

Slowing the normal loop, or making it depend on something a new contributor
cannot get in one command, needs the same justification as weakening a security
control.

## Development contract

Use Node 22. A clean checkout becomes runnable with:

```bash
./scripts/dev setup
```

The command creates a local-only `.env` when missing, reuses a warm PostgreSQL
on an automatically assigned loopback port, installs the exact lockfile,
migrates, and seeds. It is idempotent and refuses to migrate when an existing
`.env` points anywhere except the repository-owned local database.
`./scripts/dev` selects the pinned Node runtime before it starts npm, so the
caller's global Node version is irrelevant.

Use the smallest reliable signal:

1. `./scripts/dev test -- path/to/file.test.ts` for one unit surface.
2. `./scripts/dev check` for typecheck, lint, and all unit tests.
3. `./scripts/dev e2e` for UI and user flows; inspect `screenshots/`.
4. `./scripts/dev verify` for the CI-equivalent core gate: check,
   and build.

CI runs `verify` and e2e as separate profiles. Tests must not
depend on public provider endpoints; stub them or point them at a closed local
address.

Development and e2e reuse the repository's warm Docker PostgreSQL service on
an automatically assigned loopback port. Normal test loops never install host
PostgreSQL, stop the server, remove its container, or delete its image.

`npm run review:ui` is the human-review alias for the Playwright profile. Pull
requests publish its screenshots inline and retain the HTML report as an
artifact for 14 days. Its default server port is derived from the package name
so generated apps can run visual review concurrently; `E2E_PORT` overrides it.

## Architecture map

```text
src/
  app/                 Next.js App Router pages (client components use `api`)
    api/
      trpc/…           tRPC HTTP handler
      vipps/webhook/   Vipps webhook, HMAC-checked
      cron/charges/    subscription renewal, CRON_SECRET-protected
  server/
    auth.ts            Auth.js: Vipps Login and development login
    db.ts              Prisma client singleton
    vipps.ts           ePayment and shared token/headers/MSN
    vipps-recurring.ts recurring agreements and charges
    vipps-webhooks.ts  webhook registration/deletion/signature verification
    payments.ts        authoritative payment status sync
    agreements.ts      subscription status sync and charge engine
    notify/            in-app plus email/SMS/push provider stubs
    api/
      trpc.ts          context, roles, public/protected/admin procedures
      root.ts          router registry
      routers/         product routers
  lib/
    features.ts        environment-driven feature flags
    labels.ts          enum-to-UI label maps
```

The Prisma model lives in `prisma/schema.prisma`. `app.yaml` is the read-only
product-module contract used by `app-plattform`; keep it aligned with installed
capabilities and runtime defaults. It must remain cloud-neutral and contain no
secrets or deployed resource identifiers. See `docs/MODULES.md`.

## Conventions

- Add application API surface as tRPC procedures, not REST routes.
- `protectedProcedure` adds `ctx.userId`; `adminProcedure` requires ADMIN or
  OWNER for the active `ctx.orgId`.
- Gate optional capability through `src/lib/features.ts`; clients read
  `api.meta.features`.
- Payment truth comes from authenticated Vipps status fetches
  (`syncPaymentStatus` / `syncAgreementStatus`). Webhooks and redirects are
  triggers, never proof of payment.
- Use the pinned local Prisma v6 binary through `npx prisma`. To regenerate an
  initial migration offline, use `prisma migrate diff --from-empty
  --to-schema-datamodel prisma/schema.prisma --script`.
- Match surrounding style: two-space indentation, named exports, English UI.

## Common recipes

- New API procedure: add it to the relevant `src/server/api/routers/*.ts` and
  register a new router in `root.ts` when needed.
- New page: add `src/app/<name>/page.tsx`, call `api.*`, and add a role/flag
  aware link to `src/components/Nav.tsx`.
- Product illustration: use `ProductIllustration` from
  `src/components/illustrations`. Choose a semantic scene and replace its
  labels; do not introduce decorative AI-generated raster art when the
  code-native engine can explain the same relationship.
- New model: edit `prisma/schema.prisma`, create a migration, and regenerate
  Prisma. Keep tenant-optional relations optional.
- Remove the demo: delete `Item`, its router, and `/items`, then migrate.

## Guardrails

- Never commit secrets. `.env` stays ignored.
- Never bypass authenticated payment status or webhook signature checks.
- Do not hand-edit `.next/` or generated Prisma output.
- Keep changes scoped. Work on a branch; commit and push only when asked.
- Authentication, payment, tenant, role, and migration changes require
  focused regression tests.

## Review rules

- Flag `app.yaml` entries that disagree with installed code or feature
  defaults.
- Flag paths that trust payment, subscription, tenant, or role state from
  client input, redirects, or webhooks.
- Flag high-severity production dependency vulnerabilities and changes that
  weaken authentication, webhook verification, or tenant isolation.

## References

- `docs/AGENT_WORKFLOW.md` — feedback-loop rationale
- `docs/VIPPS.md` — payments, subscriptions, onboarding, and webhooks
- `docs/MODULES.md` — product-module contract
- `docs/ILLUSTRATIONS.md` — shared code-native illustration language
- `README.md` — stack and product overview
