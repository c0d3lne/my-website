import { NextRequest, NextResponse } from "next/server";
import { incrementUsedCount } from "@/lib/db";
import { redeemSchema } from "@/lib/validators";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = redeemSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({}, { status: 200 });
    incrementUsedCount(parsed.data.code);
  } catch {
    // best-effort, always 200
  }
  return NextResponse.json({ ok: true });
}
