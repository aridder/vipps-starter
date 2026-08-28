import test from "node:test";
import assert from "node:assert/strict";
import {
  devLoginAllowed,
  isVippsProduction,
  resolveVippsIssuer,
} from "./auth-policy.ts";

// Dev login signs anyone in on an unverified email. If that address is listed
// in ADMIN_EMAILS they become ADMIN, and an admin can repoint the
// organization's `vippsMsn` — so on an instance holding real Vipps keys this
// is a path from "any visitor" to "future payments land somewhere else".

const live = {
  enableDevLogin: "true",
  vippsConfigured: true,
  vippsApiBase: "https://api.vipps.no",
};

test("real Vipps credentials refuse dev login even when asked for", () => {
  assert.equal(devLoginAllowed(live), false);
  // NODE_ENV must not buy its way past this either.
  assert.equal(devLoginAllowed({ ...live, nodeEnv: "development" }), false);
});

test("the Vipps test environment still allows dev login", () => {
  assert.equal(
    devLoginAllowed({
      enableDevLogin: "true",
      vippsConfigured: true,
      vippsApiBase: "https://apitest.vipps.no",
    }),
    true,
  );
});

test("a production build without Vipps keys keeps dev login (this is CI)", () => {
  // e2e runs `next start`, so NODE_ENV is "production" while the passwordless
  // login it depends on must keep working.
  assert.equal(
    devLoginAllowed({
      enableDevLogin: "true",
      nodeEnv: "production",
      vippsConfigured: false,
      vippsApiBase: "https://apitest.vipps.no",
    }),
    true,
  );
});

test("dev login is off unless it is explicitly asked for", () => {
  const base = { vippsConfigured: false, vippsApiBase: "https://apitest.vipps.no" };
  assert.equal(devLoginAllowed({ ...base, nodeEnv: "production" }), false);
  assert.equal(
    devLoginAllowed({ ...base, enableDevLogin: "false", nodeEnv: "production" }),
    false,
  );
  // Local development remains convenient.
  assert.equal(devLoginAllowed({ ...base, nodeEnv: "development" }), true);
});

test("the login issuer follows the payment environment", () => {
  // The old default sent a test instance to the PRODUCTION issuer — the safe
  // half defaulted to test, the sensitive half did not.
  assert.match(
    resolveVippsIssuer({ vippsApiBase: "https://apitest.vipps.no" }),
    /apitest\.vipps\.no/,
  );
  assert.match(
    resolveVippsIssuer({ vippsApiBase: "https://api.vipps.no" }),
    /^https:\/\/api\.vipps\.no\//,
  );
  // A live deployment must set VIPPS_API_BASE to reach real money, so it keeps
  // the production issuer without changing any configuration.
});

test("an explicit issuer always wins", () => {
  assert.equal(
    resolveVippsIssuer({
      vippsIssuer: "https://example.test/issuer/",
      vippsApiBase: "https://api.vipps.no",
    }),
    "https://example.test/issuer/",
  );
});

test("only the Vipps production host counts as live", () => {
  assert.equal(isVippsProduction("https://api.vipps.no"), true);
  assert.equal(isVippsProduction("https://apitest.vipps.no"), false);
  // Tests point this at a closed local address; that is not production.
  assert.equal(isVippsProduction("http://127.0.0.1:9"), false);
  assert.equal(isVippsProduction("not-a-url"), false);
});
