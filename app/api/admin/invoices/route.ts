import { NextRequest, NextResponse } from "next/server";
import { createInvoiceSchema } from "@/lib/validators";
import { getAllInvoices, createInvoice } from "@/lib/invoices";

export async function GET() {
  return NextResponse.json(getAllInvoices());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createInvoiceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    const created = createInvoice(parsed.data);
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
