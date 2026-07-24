// Feature flags — resolved once on the server from environment variables.
//
// Each flag has a sensible default; override per environment with
// FEATURE_<NAME>="true" | "false" (see .env.example). Flags are exposed to the
// client through the `meta.features` tRPC query, so UI can hide/show sections.
//
// Some flags also gate real capability: `payments`/`recurring` require Vipps
// keys to actually work (see vipps.ts `vippsConfigured()`), and the flag just
// controls whether the UI offers it.

export type FeatureName =
  | "multiTenant" // organization layer (switcher, members, per-org billing)
  | "payments" // Vipps one-off payments
  | "recurring" // Vipps subscriptions (agreements)
  | "paymentAdmin" // admin billing console: refunds, reserve/capture, charge ops
  | "email" // email notifications
  | "sms" // SMS notifications
  | "push"; // web push notifications

const DEFAULTS: Record<FeatureName, boolean> = {
  multiTenant: true,
  payments: true,
  recurring: true,
  // Off by default: powerful money operations (refund/capture/cancel) stay
  // hidden and unusable until an operator explicitly enables them.
  paymentAdmin: false,
  email: false,
  sms: false,
  push: false,
};

const ENV_KEYS: Record<FeatureName, string> = {
  multiTenant: "FEATURE_MULTI_TENANT",
  payments: "FEATURE_PAYMENTS",
  recurring: "FEATURE_RECURRING",
  paymentAdmin: "FEATURE_PAYMENT_ADMIN",
  email: "FEATURE_EMAIL",
  sms: "FEATURE_SMS",
  push: "FEATURE_PUSH",
};

function envBool(key: string, fallback: boolean): boolean {
  const v = process.env[key];
  if (v === undefined || v === "") return fallback;
  return v === "true" || v === "1" || v.toLowerCase() === "yes";
}

export type Features = Record<FeatureName, boolean>;

export function resolveFeatures(): Features {
  const out = {} as Features;
  for (const name of Object.keys(DEFAULTS) as FeatureName[]) {
    out[name] = envBool(ENV_KEYS[name], DEFAULTS[name]);
  }
  return out;
}

export function isEnabled(name: FeatureName): boolean {
  return envBool(ENV_KEYS[name], DEFAULTS[name]);
}
