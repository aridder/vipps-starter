// Fixed-window rate limiting, in memory.
//
// Deliberately per-instance: it needs no Redis and no schema, and it exists to
// stop one caller hammering an endpoint, not to enforce a global quota. Scale
// horizontally and the effective limit is `perInstancePerMinute × instances` —
// size the numbers with that in mind, and reach for a shared store if you ever
// need a real quota.

export type RateLimiter = (headers: Headers) => boolean;

export function createRateLimiter(limits: {
  perSourcePerMinute: number;
  perInstancePerMinute: number;
}): RateLimiter {
  let windowStartedAt = Date.now();
  let instanceCount = 0;
  const sourceCounts = new Map<string, number>();

  return function isRateLimited(headers: Headers): boolean {
    const now = Date.now();
    if (now - windowStartedAt >= 60_000) {
      windowStartedAt = now;
      instanceCount = 0;
      sourceCounts.clear();
    }

    // Everything behind the same proxy shares "unknown", so a missing
    // forwarded-for makes the per-source limit strict rather than absent.
    const source =
      headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ??
      "unknown";
    const count = (sourceCounts.get(source) ?? 0) + 1;
    sourceCounts.set(source, count);
    if (count > limits.perSourcePerMinute) return true;

    instanceCount += 1;
    return instanceCount > limits.perInstancePerMinute;
  };
}
