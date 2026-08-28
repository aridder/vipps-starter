import { createHash, timingSafeEqual } from "node:crypto";

// `a !== b` on a secret returns as soon as two bytes differ, so how long it
// takes to answer leaks how much of the prefix was right. Hashing first gives
// both sides a fixed 32 bytes, so `timingSafeEqual` never has to be told about
// unequal lengths — and the length of the real secret does not leak either.
export function secretEquals(a: string, b: string): boolean {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(a), digest(b));
}

/** Constant-time check of an `Authorization: Bearer <secret>` header. */
export function matchesBearer(
  header: string | null,
  secret: string,
): boolean {
  if (!header || !secret) return false;
  return secretEquals(header, `Bearer ${secret}`);
}
