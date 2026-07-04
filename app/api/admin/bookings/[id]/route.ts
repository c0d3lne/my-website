import { NextRequest, NextResponse } from "next/server";
import { bookingUpdateSchema } from "@/lib/validators";
import { updateBookingStatus, setDepositPaid, getBookingById } from "@/lib/bookings";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = bookingUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    if (!getBookingById(id)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (parsed.data.status !== undefined) updateBookingStatus(id, parsed.data.status);
    if (parsed.data.depositPaid !== undefined) setDepositPaid(id, parsed.data.depositPaid);
    return NextResponse.json(getBookingById(id));
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
