import { NextResponse } from "next/server";

// Lightweight liveness probe for the platform health check.
// Does not touch the database — it only confirms the app is serving.
export const dynamic = "force-dynamic";

export function GET(): NextResponse {
  return NextResponse.json({ status: "ok" });
}
