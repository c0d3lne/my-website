import { NextRequest, NextResponse } from "next/server";
import { getCustomerById } from "@/lib/customers";
import { getReferralProgress } from "@/lib/referrals";
import { getInvoicesByEmail } from "@/lib/invoices";
import { getBookingsByEmail } from "@/lib/bookings";
import { getPhotosByEmail } from "@/lib/photos";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const customer = getCustomerById(id);
  if (!customer) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const photos = getPhotosByEmail(customer.email);
  const bookings = getBookingsByEmail(customer.email).map((b) => ({
    ...b,
    photos: {
      before: photos.filter((p) => p.bookingId === b.id && p.kind === "before"),
      after: photos.filter((p) => p.bookingId === b.id && p.kind === "after"),
    },
  }));

  return NextResponse.json({
    customer,
    referral: getReferralProgress(customer.email),
    invoices: getInvoicesByEmail(customer.email),
    bookings,
  });
}
