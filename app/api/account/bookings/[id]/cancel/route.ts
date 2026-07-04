import { NextRequest, NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById } from "@/lib/customers";
import { getBookingById, updateBookingStatus, cancellationInfo } from "@/lib/bookings";

// A customer may cancel their OWN booking, but only within policy: not once it's
// completed/cancelled, and not inside the 24-hour notice window. The deposit is
// non-refundable either way — this is what prevents random cancellations.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const session = await getCustomerSession();
  if (!session.customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const customer = getCustomerById(session.customerId);
  const booking = getBookingById(id);
  if (!customer || !booking || booking.customerEmail !== customer.email) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const policy = cancellationInfo(booking);
  if (!policy.cancellable) {
    return NextResponse.json({ error: policy.reason }, { status: 403 });
  }

  const updated = updateBookingStatus(id, "cancelled");
  return NextResponse.json({ ok: true, booking: updated });
}
