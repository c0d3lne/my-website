import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomId } from "@/lib/db";
import { addPhoto, getPhotosByBooking } from "@/lib/photos";
import { getBookingById } from "@/lib/bookings";

export const runtime = "nodejs";

const ALLOWED: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
const MAX_BYTES = 10 * 1024 * 1024; // 10MB

export async function GET(req: NextRequest) {
  const bookingId = req.nextUrl.searchParams.get("bookingId");
  if (!bookingId) {
    return NextResponse.json({ error: "bookingId required" }, { status: 400 });
  }
  return NextResponse.json(getPhotosByBooking(bookingId));
}

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const bookingId = String(form.get("bookingId") ?? "");
    const kind = String(form.get("kind") ?? "");
    const file = form.get("file");

    if (!bookingId || (kind !== "before" && kind !== "after")) {
      return NextResponse.json({ error: "bookingId and kind (before|after) required" }, { status: 400 });
    }
    const booking = getBookingById(bookingId);
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }
    const ext = ALLOWED[file.type];
    if (!ext) {
      return NextResponse.json({ error: "Unsupported image type" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ error: "Image too large (max 10MB)" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadsDir, { recursive: true });
    const filename = `${randomId()}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const photo = addPhoto({
      bookingId,
      customerEmail: booking.customerEmail,
      kind,
      path: `/uploads/${filename}`,
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
