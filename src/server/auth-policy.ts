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
