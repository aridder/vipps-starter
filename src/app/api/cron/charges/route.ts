import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { processDueCharges } from "@/server/agreements";
import { matchesBearer } from "@/server/secret-compare";

// Daily Vercel Cron. Creates Vipps charges for active subscriptions due soon and
// syncs outstanding charges to PAID. See cron config in vercel.json.
//
// Protected by CRON_SECRET: Vercel sends "Authorization: Bearer $CRON_SECRET".
// If CRON_SECRET is unset the endpoint refuses all calls (never left open).
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request): Promise<NextResponse> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not set" }, { status: 500 });
  }
  if (!matchesBearer(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  try {
    const result = await processDueCharges(db);
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("Cron charges failed:", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "error" },
      { status: 500 },
    );
  }
}
