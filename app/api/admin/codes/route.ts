import { NextRequest, NextResponse } from "next/server";
import { getAllCodes, createCode, getDb } from "@/lib/db";
import { createCodeSchema } from "@/lib/validators";
import { randomUUID } from "crypto";

export async function GET() {
  const codes = getAllCodes();
  return NextResponse.json(codes);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createCodeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const db = getDb();
    const existing = db
      .prepare("SELECT id FROM discount_codes WHERE code = ?")
      .get(parsed.data.code);
    if (existing) {
      return NextResponse.json(
        { error: "A code with that name already exists" },
        { status: 409 }
      );
    }

    const created = createCode({ id: randomUUID(), ...parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
