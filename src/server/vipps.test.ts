import test from "node:test";
import assert from "node:assert/strict";
import { idempotencyKey } from "./vipps.ts";

// The idempotency key is the only thing separating a retry from a second
// payout.
//
// Vipps is explicit: "the capture request in an idempotent retry must be
// identical to the previous request(s)". With a fresh UUID per call a retry
// is not a retry to them — it is a new refund, and the merchant pays out
// twice for the same order.

test("the same operation produces the same key", () => {
  // This is the whole point. If the connection drops after Vipps processed
  // the refund but before the response reached us, the second attempt must
  // carry the same key.
  assert.equal(
    idempotencyKey("refund", "order-1"),
    idempotencyKey("refund", "order-1"),
  );
});

test("different operations do not collide", () => {
  assert.notEqual(
    idempotencyKey("refund", "order-1"),
    idempotencyKey("refund", "order-2"),
  );
});

test("capture and refund on the same order are different operations", () => {
  // Without the action in the key, refunding the same amount on the same
  // payment would look like a repeat of the capture and be swallowed.
  assert.notEqual(
    idempotencyKey("capture", "order-1"),
    idempotencyKey("refund", "order-1"),
  );
});

test("the key stays within the Vipps length limit", () => {
  assert.ok(idempotencyKey("refund", "x".repeat(200)).length <= 50);
});
