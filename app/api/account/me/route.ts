import { NextResponse } from "next/server";
import { getCustomerSession } from "@/lib/customer-auth";
import { getCustomerById } from "@/lib/customers";
import { getReferralProgress } from "@/lib/referrals";
import { getInvoicesByEmail } from "@/lib/invoices";
import { getBookingsByEmail, cancellationInfo } from "@/lib/bookings";
import { getPhotosByEmail } from "@/lib/photos";
import { stripeConfigured } from "@/lib/stripe";

export async function GET() {
  const session = await getCustomerSession();
  if (!session.customerId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const customer = getCustomerById(session.customerId);
  if (!customer) {
    session.destroy();
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const invoices = getInvoicesByEmail(customer.email);
  const bookings = getBookingsByEmail(customer.email);
  const photos = getPhotosByEmail(customer.email);

  // Group photos onto their booking + attach the cancellation policy result.
  const bookingsWithPhotos = bookings.map((b) => ({
    ...b,
    cancellation: cancellationInfo(b),
    photos: {
      before: photos.filter((p) => p.bookingId === b.id && p.kind === "before"),
      after: photos.filter((p) => p.bookingId === b.id && p.kind === "after"),
    },
  }));

  return NextResponse.json({
    customer: {
      email: customer.email,
      name: customer.name,
      phone: customer.phone,
      address: customer.address,
      referralCode: customer.referralCode,
    },
    referral: getReferralProgress(customer.email),
    invoices,
    bookings: bookingsWithPhotos,
    stripeEnabled: stripeConfigured(),
  });
}
