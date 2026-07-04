import { NextRequest, NextResponse } from "next/server";
import { availabilitySchema } from "@/lib/validators";
import { getBlockedDays, setDayBlocked } from "@/lib/availability";
import { getDb } from "@/lib/db";

export async function GET() {
  const blockedDays = getBlockedDays();
  const rows = getDb()
    .prepare(
      `SELECT date, time FROM bookings
       WHERE status != 'cancelled' AND date IS NOT NULL AND time IS NOT NULL`
    )
    .all() as Array<{ date: string; time: string }>;
  const taken: Record<string, string[]> = {};
  for (const r of rows) (taken[r.date] ??= []).push(r.time);
  return NextResponse.json({ blockedDays, taken });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = availabilitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    setDayBlocked(parsed.data.date, parsed.data.blocked);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
