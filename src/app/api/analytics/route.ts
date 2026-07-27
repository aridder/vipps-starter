import { NextResponse } from "next/server";
import {
  hashAnalyticsId,
  trackProductEvent,
} from "@/lib/server-telemetry";

const eventNamePattern = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;

export async function POST(request: Request) {
  if (process.env.PLATFORM_ANALYTICS_ENABLED === "false") {
    return new NextResponse(null, { status: 202 });
  }

  if (Number(request.headers.get("content-length") ?? 0) > 8192) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  const body = (await request.json().catch(() => null)) as {
    name?: unknown;
    anonymousId?: unknown;
    sessionId?: unknown;
    properties?: unknown;
  } | null;

  if (
    !body ||
    typeof body.name !== "string" ||
    !eventNamePattern.test(body.name) ||
    body.name.length > 128 ||
    typeof body.anonymousId !== "string" ||
    body.anonymousId.length > 128 ||
    typeof body.sessionId !== "string" ||
    body.sessionId.length > 128 ||
    !body.properties ||
    typeof body.properties !== "object" ||
    Array.isArray(body.properties)
  ) {
    return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  }

  trackProductEvent(
    body.name,
    body.properties as Record<
      string,
      string | number | boolean | null | undefined
    >,
    {
      actorIdHash: hashAnalyticsId("anonymous", body.anonymousId),
      sessionIdHash: hashAnalyticsId("session", body.sessionId),
    },
  );

  return new NextResponse(null, { status: 202 });
}
