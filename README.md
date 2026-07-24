# Vipps Starter

A production-ready **Vipps payments** starter for Next.js — one-off payments,
subscriptions (recurring), webhooks with signature validation, and the
partner/super-merchant model, all wired up on a modern stack.

> **Try it live:** the hosted demo lets you make a **real Vipps donation** to the
> maintainer, so you can see the whole flow work before you clone. 👉 see the
> landing page.

## Stack

Next.js 15 (App Router, React 19) · tRPC v11 · Prisma 6 + PostgreSQL ·
Auth.js v5 (Vipps Login + dev login) · Tailwind v4 · Playwright.

## What you get (the Vipps part)

| Feature | Where |
|---------|-------|
| One-off payments (ePayment) | `payment` router, `src/server/vipps.ts`, `payments.ts` |
| Subscriptions + daily renewal cron | `subscription` router, `agreements.ts`, `/api/cron/charges` |
| Webhooks + HMAC signature check | `/api/vipps/webhook`, `vipps-webhooks.ts` |
| Partner onboarding (webhook per MSN) | `org.connectVipps`, Settings page |
| Refunds, reserve/capture console | `/billing/admin` (behind `FEATURE_PAYMENT_ADMIN`, off by default) |
| Public landing + live donation | `src/app/page.tsx`, `src/lib/site.ts` |

Full details: [`docs/VIPPS.md`](docs/VIPPS.md).

## Quick start

```bash
cp .env.example .env         # set DATABASE_URL, AUTH_SECRET, and NEXT_PUBLIC_* branding
npm install
npm run db:up                # local Postgres (docker)
npm run db:reset             # migrate + seed
npm run dev                  # http://localhost:3000
```

Add Vipps **test** keys (`apitest.vipps.no`) to `.env`, then in the app go to
**Settings → Vipps connection → Connect**. Now the donation button on the
landing page takes real (test) Vipps payments.

## Rebranding (make it yours)

Everything on the landing page is driven by `NEXT_PUBLIC_*` env vars (see
`src/lib/site.ts`): app name, tagline, GitHub URL, and the **Built by** section
(your name, services URL, contact email). No code changes needed to rebrand.

## License

Source-available under the **[PolyForm Small Business License 1.0.0](LICENSE)**:

- ✅ Free to use if your company has **< 100 people** and **< $1M** revenue.
- 💼 Larger companies need a commercial license — contact the maintainer.
- 🙏 Donations are always welcome (there's a Vipps button on the landing page).

Keep the `Required Notice:` line in `LICENSE` when you redistribute.

## Support & hire

Built and maintained by an independent developer. If this saves you time,
support it via the Vipps donation on the landing page — and if you need help
with Vipps, payments or Next.js, the landing page links to services and contact.

## Testing

```bash
npm run verify               # typecheck + lint + build
npm run test:e2e             # Playwright + screenshots
```

CI runs everything against a Postgres service and posts screenshots inline on
PRs. See [`docs/AGENT_WORKFLOW.md`](docs/AGENT_WORKFLOW.md) and
[`AGENTS.md`](AGENTS.md).
