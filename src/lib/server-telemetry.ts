import { createHash } from "node:crypto";

type PropertyValue = string | number | boolean | null | undefined;
type Properties = Record<string, PropertyValue>;
type AnalyticsContext = {
  actorIdHash?: string;
  sessionIdHash?: string;
};

const blockedKey =
  /password|token|secret|cookie|authorization|payment|prompt|document|email|phone|name/i;
const maxValueLength = 256;

function sanitize(properties: Properties = {}): Properties {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (
        blockedKey.test(key) &&
        typeof value !== "number" &&
        typeof value !== "boolean"
      ) {
        return [key, "[redacted]"];
      }
      if (typeof value === "string") {
        return [key, value.slice(0, maxValueLength)];
      }
      return [key, value];
    }),
  );
}

export function trackProductEvent(
  eventName: string,
  properties: Properties = {},
  context: AnalyticsContext = {},
) {
  if (process.env.PLATFORM_ANALYTICS_ENABLED === "false") return;

  console.log(
    JSON.stringify({
      schemaVersion: 1,
      kind: "product_event",
      serviceName:
        process.env.OTEL_SERVICE_NAME ??
        process.env.NEXT_PUBLIC_APP_NAME ??
        "app",
      environment: process.env.AZURE_ENVIRONMENT ?? "local",
      serviceVersion: process.env.APP_VERSION ?? "development",
      timestamp: new Date().toISOString(),
      eventName: eventName.slice(0, 128),
      ...context,
      properties: sanitize(properties),
    }),
  );
}

export function hashAnalyticsId(scope: string, value: string) {
  const salt =
    process.env.ANALYTICS_HASH_SALT ??
    process.env.NEXT_PUBLIC_APP_NAME ??
    "local-development";

  return createHash("sha256")
    .update(`${salt}:${scope}:${value}`)
    .digest("hex");
}
