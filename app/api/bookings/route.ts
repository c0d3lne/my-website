import { NextRequest, NextResponse } from "next/server";
import { createBookingSchema } from "@/lib/validators";
import { createBooking, isSlotTaken } from "@/lib/bookings";
import { resolveTravelCharge } from "@/lib/travel";

// Public endpoint: the quote form persists the booking here (so we can prevent
// double bookings and track referrals) before handing off to WhatsApp/Messenger.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid booking" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Guard against double bookings on a specific date + time.
    if (data.date && data.time && isSlotTaken(data.date, data.time)) {
      return NextResponse.json(
        { error: "That time slot has just been booked. Please pick another." },
        { status: 409 }
      );
    }

    // Travel charge is authoritative on the server, derived from the area/postcode.
    const travelCharge = data.travelArea
      ? resolveTravelCharge(data.travelArea).charge
      : 0;

    const booking = createBooking({ ...data, travelCharge });
    return NextResponse.json({ id: booking.id, status: booking.status }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
