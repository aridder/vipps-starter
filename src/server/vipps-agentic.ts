// Experimental boundary for Vipps Agentic Commerce.
//
// Vipps currently documents this product as under development. Keeping the
// contract isolated lets the app expose UCP metadata later without coupling
// checkout code to an unstable API.

export type VippsPaymentHandlerManifest = {
  id: "vipps-mobilepay";
  version: "2026-07-experimental";
  capabilities: ["payment"];
  environment: "test" | "production";
};

export function getVippsPaymentHandlerManifest(): VippsPaymentHandlerManifest {
  return {
    id: "vipps-mobilepay",
    version: "2026-07-experimental",
    capabilities: ["payment"],
    environment:
      process.env.VIPPS_API_BASE === "https://api.vipps.no"
        ? "production"
        : "test",
  };
}
