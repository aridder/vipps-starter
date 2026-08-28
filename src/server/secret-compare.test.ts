import test from "node:test";
import assert from "node:assert/strict";
import { matchesBearer, secretEquals } from "./secret-compare.ts";

// The cron endpoint moves money: it creates Vipps charges for every due
// subscription. Its only guard is this comparison.

test("the right secret is accepted and a wrong one is not", () => {
  assert.equal(secretEquals("s3cret", "s3cret"), true);
  assert.equal(secretEquals("s3cret", "s3crev"), false);
});

test("a matching prefix is still rejected", () => {
  // The failure mode `!==` had: it answers early, so response time reveals how
  // much of the prefix was right and the secret can be guessed byte by byte.
  assert.equal(secretEquals("supersecret", "supersecre"), false);
  assert.equal(secretEquals("supersecret", "s"), false);
});

test("bearer headers are matched whole", () => {
  assert.equal(matchesBearer("Bearer token", "token"), true);
  assert.equal(matchesBearer("Bearer wrong", "token"), false);
  // No scheme, wrong scheme, or the bare secret must not pass.
  assert.equal(matchesBearer("token", "token"), false);
  assert.equal(matchesBearer("Basic token", "token"), false);
});

test("a missing header or unset secret is refused, never treated as a match", () => {
  assert.equal(matchesBearer(null, "token"), false);
  assert.equal(matchesBearer("Bearer ", ""), false);
  assert.equal(matchesBearer(null, ""), false);
});
