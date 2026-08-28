import test from "node:test";
import assert from "node:assert/strict";
import { createRateLimiter } from "./rate-limit.ts";

const from = (ip?: string) =>
  new Headers(ip ? { "x-forwarded-for": ip } : undefined);

test("a source is cut off at its limit, and only that source", () => {
  const limited = createRateLimiter({
    perSourcePerMinute: 3,
    perInstancePerMinute: 100,
  });
  for (let i = 0; i < 3; i++) {
    assert.equal(limited(from("1.1.1.1")), false, `call ${i + 1} should pass`);
  }
  assert.equal(limited(from("1.1.1.1")), true);
  // A different caller is unaffected — one abuser must not close the donation
  // form for everyone else.
  assert.equal(limited(from("2.2.2.2")), false);
});

test("the instance ceiling catches a distributed flood", () => {
  const limited = createRateLimiter({
    perSourcePerMinute: 10,
    perInstancePerMinute: 3,
  });
  for (let i = 0; i < 3; i++) {
    assert.equal(limited(from(`10.0.0.${i}`)), false);
  }
  assert.equal(limited(from("10.0.0.99")), true);
});

test("proxies that strip the header share one strict bucket", () => {
  // Missing forwarded-for must make the limit strict, not absent.
  const limited = createRateLimiter({
    perSourcePerMinute: 2,
    perInstancePerMinute: 100,
  });
  assert.equal(limited(from()), false);
  assert.equal(limited(from()), false);
  assert.equal(limited(from()), true);
});

test("only the first forwarded-for hop counts", () => {
  // A client can append to x-forwarded-for, so trusting the last hop would let
  // it mint a fresh bucket per request.
  const limited = createRateLimiter({
    perSourcePerMinute: 1,
    perInstancePerMinute: 100,
  });
  assert.equal(limited(from("9.9.9.9, 10.0.0.1")), false);
  assert.equal(limited(from("9.9.9.9, 10.0.0.2")), true);
});
