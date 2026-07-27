import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/api/trpc";
import {
  analyticsEnabled,
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";

const clientEventName = z.enum([
  "app.session_started",
  "app.page_viewed",
  "app.engagement_reached",
  "app.navigation_clicked",
  "technical.web_vital",
  "technical.client_error",
  "auth.login_started",
]);
const propertyValue = z.union([
  z.string().max(256),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
const properties = z.record(z.string(), propertyValue).superRefine((value, ctx) => {
  const entries = Object.entries(value);
  if (entries.length > 25) {
    ctx.addIssue({ code: "custom", message: "Too many properties" });
  }
  for (const [key] of entries) {
    if (!/^[A-Za-z][A-Za-z0-9_]{0,63}$/.test(key)) {
      ctx.addIssue({ code: "custom", message: "Invalid property key" });
    }
  }
});

const maxEventsPerSourcePerMinute = 60;
const maxEventsPerInstancePerMinute = 600;
let rateLimitWindowStartedAt = Date.now();
let instanceEventCount = 0;
const sourceEventCounts = new Map<string, number>();

function isRateLimited(headers: Headers) {
  const now = Date.now();
  if (now - rateLimitWindowStartedAt >= 60_000) {
    rateLimitWindowStartedAt = now;
    instanceEventCount = 0;
    sourceEventCounts.clear();
  }

  const source =
    headers.get("x-forwarded-for")?.split(",")[0]?.trim().slice(0, 64) ??
    "unknown";
  const count = (sourceEventCounts.get(source) ?? 0) + 1;
  sourceEventCounts.set(source, count);
  if (count > maxEventsPerSourcePerMinute) return true;

  instanceEventCount += 1;
  return instanceEventCount > maxEventsPerInstancePerMinute;
}

export const analyticsRouter = createTRPCRouter({
  enabled: publicProcedure.query(() => ({ enabled: analyticsEnabled() })),
  track: publicProcedure
    .input(
      z.object({
        name: clientEventName,
        anonymousId: z.string().uuid(),
        sessionId: z.string().uuid(),
        properties,
      }),
    )
    .mutation(({ ctx, input }) => {
      if (!analyticsEnabled() || isRateLimited(ctx.headers)) {
        return { accepted: false };
      }

      trackProductEvent(input.name, input.properties, {
        actorIdHash: hashAnalyticsId("anonymous", input.anonymousId),
        sessionIdHash: hashAnalyticsId("session", input.sessionId),
      });
      return { accepted: true };
    }),
});
