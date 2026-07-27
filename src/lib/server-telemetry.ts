import { createHmac } from "node:crypto";
import { logs, SeverityNumber } from "@opentelemetry/api-logs";

type PropertyValue = string | number | boolean | null | undefined;
type Properties = Record<string, PropertyValue>;
type AnalyticsContext = {
  actorIdHash?: string;
  sessionIdHash?: string;
};

const blockedTerms = new Set([
  "password",
  "access_token",
  "refresh_token",
  "auth_token",
  "secret",
  "cookie",
  "authorization",
  "payment_card",
  "prompt",
  "document",
  "email",
  "phone",
  "full_name",
]);
const maxValueLength = 256;

function normalizedKey(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[^a-z0-9]+/gi, "_")
    .toLowerCase();
}

function blockedKey(key: string) {
  const normalized = normalizedKey(key);
  return [...blockedTerms].some(
    (term) =>
      normalized === term ||
      normalized.startsWith(`${term}_`) ||
      normalized.endsWith(`_${term}`),
  );
}

function sanitize(properties: Properties = {}): Properties {
  return Object.fromEntries(
    Object.entries(properties).map(([key, value]) => {
      if (blockedKey(key)) return [key, "[redacted]"];
      if (typeof value === "string") {
        return [key, value.slice(0, maxValueLength)];
      }
      return [key, value];
    }),
  );
}

export function analyticsEnabled() {
  if (process.env.PLATFORM_ANALYTICS_ENABLED === "false") return false;
  if (
    process.env.NODE_ENV === "production" &&
    !process.env.ANALYTICS_HASH_SALT
  ) {
    return false;
  }
  return true;
}

export function trackProductEvent(
  eventName: string,
  properties: Properties = {},
  context: AnalyticsContext = {},
) {
  if (!analyticsEnabled()) return;

  const serviceName =
    process.env.OTEL_SERVICE_NAME ??
    process.env.NEXT_PUBLIC_APP_NAME ??
    "app";
  const entry = {
    schemaVersion: 1,
    kind: "product_event",
    serviceName,
    environment: process.env.AZURE_ENVIRONMENT ?? "local",
    serviceVersion: process.env.APP_VERSION ?? "development",
    timestamp: new Date().toISOString(),
    eventName: eventName.slice(0, 128),
    ...context,
    properties: sanitize(properties),
  };
  const body = JSON.stringify(entry);

  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    logs.getLogger(serviceName).emit({
      eventName: "product_event",
      severityNumber: SeverityNumber.INFO,
      severityText: "INFO",
      body,
      attributes: {
        "app.event.name": entry.eventName,
        "app.service.name": serviceName,
        "app.environment": entry.environment,
        ...(context.actorIdHash
          ? { "app.actor.id_hash": context.actorIdHash }
          : {}),
        ...(context.sessionIdHash
          ? { "app.session.id_hash": context.sessionIdHash }
          : {}),
      },
    });
    return;
  }

  console.log(body);
}

export function hashAnalyticsId(scope: string, value: string) {
  const salt = process.env.ANALYTICS_HASH_SALT;
  if (!salt) {
    if (process.env.NODE_ENV === "production") return undefined;
    return createHmac("sha256", "local-development")
      .update(`${scope}:${value}`)
      .digest("hex");
  }

  return createHmac("sha256", salt)
    .update(`${scope}:${value}`)
    .digest("hex");
}
