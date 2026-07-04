import { NextRequest, NextResponse } from "next/server";
import { findValidCode } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code") ?? "";
  if (!code) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }

  const found = findValidCode(code);
  if (!found) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }

  return NextResponse.json({
    code: found.code,
    type: found.type,
    value: found.value,
    description: found.description,
  });
}
