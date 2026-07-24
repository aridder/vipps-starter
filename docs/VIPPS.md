# Vipps — setup & architecture

How payments, subscriptions and partner (super-merchant) operation fit together.
Money always goes directly to each tenant's own Vipps account — the platform
never touches funds.

## 1. Two payment forms

| Form | API | Code |
|------|-----|------|
| **One-off payment** | ePayment | `src/server/vipps.ts`, `payments.ts`, `payment` router |
| **Subscription** | Recurring | `src/server/vipps-recurring.ts`, `agreements.ts`, `subscription` router |

Both share the access token, MSN lookup and headers (`getAccessToken`,
`baseHeaders` in `vipps.ts`).

**Security principle:** a webhook or return URL is only a *trigger*. Actual
status is always fetched with an authenticated Vipps call
(`syncPaymentStatus` / `syncAgreementStatus`), so a forged message can never
fake a payment.

## 2. Keys & environment

Test base is the default (`VIPPS_API_BASE=https://apitest.vipps.no`); set
`https://api.vipps.no` in production.

**Single-merchant (test / one tenant):**

```
VIPPS_SUBSCRIPTION_KEY   Ocp-Apim-Subscription-Key (primary)
VIPPS_MSN                sale unit number
VIPPS_API_CLIENT_ID      client_id
VIPPS_API_CLIENT_SECRET  client_secret
```

**Partner / super-merchant (prod):** platform partner keys take precedence over
single-merchant keys.

```
VIPPS_PARTNER_CLIENT_ID
VIPPS_PARTNER_CLIENT_SECRET
VIPPS_SUBSCRIPTION_KEY     (the partner's)
```

Each org sets its own MSN (`Organization.vippsMsn`). Partner keys work in
production only — test runs with regular merchant test keys.

Other env vars:

```
CRON_SECRET                        protects /api/cron/charges
VIPPS_WEBHOOK_ENFORCE_SIGNATURE    "true" = enforce webhook signature (see §6)
```

## 3. One-off payment (ePayment)

1. `payment.create` creates a `Payment` (CREATED) and returns a `redirectUrl`
2. User approves in Vipps → returns to `/billing/receipt?ref=…`
3. The receipt page polls `payment.status` → `syncPaymentStatus` fetches
   authoritative status and captures on authorization → `PAID`
4. `/api/vipps/webhook` does the same in real time as backup

## 4. Subscriptions (Recurring)

1. `subscription.create` (user must be signed in) creates an `Agreement`
   (PENDING) with an interval (`MONTH`/`YEAR`) and an **initial charge**, and
   returns Vipps' `vippsConfirmationUrl`
2. User approves → agreement becomes `ACTIVE`, first period charged immediately
3. `/billing/subscription/receipt?id=…` polls `subscription.status`
4. **Renewal:** a daily Vercel Cron (`/api/cron/charges`, 06:00) runs
   `processDueCharges`, which creates the next charge before it's due
   (idempotent per period) and books completed charges as `Payment` (PAID)
5. User can cancel (`subscription.stop`); admins see all in `/billing/overview`

Data model: `Agreement` (one subscription) → `AgreementCharge` (one per period).
`Payment.agreementId` links booked charges to the subscription.

## 5. Partner onboarding (super-merchant)

Because money goes straight to each tenant's Vipps account, the platform never
handles funds — no payment-institution licence required.

To connect a tenant (admin, under **Settings**):

1. Enter the org's **MSN** and save
2. Click **Connect to Vipps** → `org.connectVipps` registers a Vipps webhook
   for that MSN (`registerWebhook`), clearing duplicates first, and stores
   `vippsWebhookId` + `vippsWebhookSecret`
3. **Disconnect** deletes the webhook at Vipps

Every Vipps call sets `Merchant-Serial-Number` to the org's MSN, so payments,
subscriptions and webhooks are all per tenant. Partner keys are never exposed to
tenants (server-side only).

**Platform fee:** Vipps does not split payments automatically. If the platform
wants a cut, handle it out of band (separate invoicing, etc.).

## 6. Webhook signature

`/api/vipps/webhook` handles both ePayment and recurring events. When the org
has a stored `vippsWebhookSecret`, the HMAC-SHA256 signature is validated
(`verifyVippsSignature`, timing-safe) over method, path, `x-ms-date`, host and
content hash.

- **Default = WARN mode:** mismatches are logged but the message is still
  processed (status sync is authoritative), so a signature quirk can never break
  the real-time flow.
- **Enforce:** set `VIPPS_WEBHOOK_ENFORCE_SIGNATURE="true"` to return `401` on
  mismatch — flip it on once prod logs confirm real signatures verify.

Without a known secret (single-merchant, no onboarding) the signature check is
skipped and the authoritative sync runs as before.

## 7. Troubleshooting

- **`Vipps accesstoken failed`** — wrong/mismatched subscription key or MSN.
- **Payments off** — requires MSN + client_id + client_secret + subscription key.
- **Charges not created** — check `CRON_SECRET` and that the Vercel cron runs
  (Settings → Cron Jobs). The receipt page's polling covers the user flow even
  if webhooks are missed.
- **"signature did not match" in logs** — leave it in warn mode; verify
  `host`/path against the registered webhook URL before enforcing.
