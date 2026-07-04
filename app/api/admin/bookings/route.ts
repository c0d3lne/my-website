import { NextResponse } from "next/server";
import { getAllBookings } from "@/lib/bookings";

export async function GET() {
  return NextResponse.json(getAllBookings());
}
