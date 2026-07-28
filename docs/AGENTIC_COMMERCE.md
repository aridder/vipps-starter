# Vipps Agentic Commerce adapter

Vipps MobilePay's Agentic Commerce work is based on the Universal Commerce
Protocol (UCP) and a Vipps Payment Handler. The public documentation currently
labels the product as under development, so this repository treats it as an
experimental boundary rather than a live payment path.

## Current implementation

- `src/server/vipps-agentic.ts` owns the versioned handler manifest.
- `FEATURE_AGENTIC_COMMERCE=false` is the safe default.
- No agent-facing endpoint creates, captures or refunds money.
- Existing ePayment remains the authoritative implementation behind human
  checkout.

## Activation criteria

Do not enable a live endpoint until all of these are true:

1. Vipps publishes a stable Payment Handler request/response contract.
2. The separate vipps-starter product application includes Agentic Commerce.
3. Agent identity, merchant intent and user consent are authenticated.
4. Idempotency and amount/product validation happen server-side.
5. Webhook signatures and authenticated API status lookup are enforced.
6. The integration has dedicated test and production credentials.

When the contract stabilizes, add a versioned adapter beside
`vipps-agentic.ts`; do not leak UCP-specific fields into `vipps.ts`.
