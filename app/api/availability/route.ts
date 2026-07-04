import { NextResponse } from "next/server";
import { getBlockedDays } from "@/lib/availability";
import { getDb } from "@/lib/db";

// Public: the calendar needs to know which days are switched off and which
// time slots are already taken, from today onward.
export async function GET() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const blockedDays = getBlockedDays(from);

  const rows = getDb()
    .prepare(
      `SELECT date, time FROM bookings
       WHERE status != 'cancelled' AND date >= ? AND date IS NOT NULL AND time IS NOT NULL`
    )
    .all(from) as Array<{ date: string; time: string }>;

  const taken: Record<string, string[]> = {};
  for (const r of rows) {
    (taken[r.date] ??= []).push(r.time);
  }

  return NextResponse.json({ blockedDays, taken });
}
