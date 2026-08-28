// Pure auth policy decisions, kept free of Auth.js and Prisma imports so they
// can be unit tested without instantiating either.

/** True only for the Vipps production host — test and closed local addresses are not. */
export function isVippsProduction(apiBase: string): boolean {
  try {
    return new URL(apiBase).hostname === "api.vipps.no";
  } catch {
    return false;
  }
}

const TEST_ISSUER = "https://apitest.vipps.no/access-management-1.0/access/";
const PRODUCTION_ISSUER = "https://api.vipps.no/access-management-1.0/access/";

/**
 * Which Vipps Login issuer to trust when VIPPS_ISSUER is not set.
 *
 * Derived from the payment API base rather than hardcoded, so the two can't
 * disagree: an instance talking to the test API signing users in against
 * production was the old default, and it defaulted the *safe* half (payments)
 * to test while defaulting the sensitive half to production. Deriving it also
 * means live deployments — which must set VIPPS_API_BASE to reach real money —
 * keep the production issuer without changing anything.
 */
export function resolveVippsIssuer(env: {
  vippsIssuer?: string;
  vippsApiBase: string;
}): string {
  if (env.vippsIssuer) return env.vippsIssuer;
  return isVippsProduction(env.vippsApiBase) ? PRODUCTION_ISSUER : TEST_ISSUER;
}

/**
 * Dev login authenticates on an unverified email alone, and ADMIN_EMAILS then
 * grants ADMIN to whoever types that address. An admin can repoint the
 * organization's `vippsMsn`, so on an instance wired to real Vipps credentials
 * that is a path from "anyone" to "future payments land elsewhere". Refuse it
 * there regardless of ENABLE_DEV_LOGIN.
 *
 * NODE_ENV alone is not the gate: e2e runs `next start` (NODE_ENV=production)
 * against a build with no Vipps keys, and must keep its passwordless login.
 */
export function devLoginAllowed(env: {
  enableDevLogin?: string;
  nodeEnv?: string;
  vippsConfigured: boolean;
  vippsApiBase: string;
}): boolean {
  if (env.vippsConfigured && isVippsProduction(env.vippsApiBase)) return false;
  return env.enableDevLogin === "true" || env.nodeEnv === "development";
}
