import { getDb, randomId } from "./db";
import { normalizeEmail } from "./customers";

export type PhotoKind = "before" | "after";

export type BookingPhoto = {
  id: string;
  bookingId: string;
  customerEmail: string;
  kind: PhotoKind;
  path: string;
  createdAt: string;
};

type DbPhoto = {
  id: string;
  booking_id: string;
  customer_email: string;
  kind: PhotoKind;
  path: string;
  created_at: string;
};

function toPhoto(row: DbPhoto): BookingPhoto {
  return {
    id: row.id,
    bookingId: row.booking_id,
    customerEmail: row.customer_email,
    kind: row.kind,
    path: row.path,
    createdAt: row.created_at,
  };
}

export function addPhoto(data: {
  bookingId: string;
  customerEmail: string;
  kind: PhotoKind;
  path: string;
}): BookingPhoto {
  const db = getDb();
  const id = randomId();
  db.prepare(
    `INSERT INTO booking_photos (id, booking_id, customer_email, kind, path, created_at)
     VALUES (@id, @booking, @email, @kind, @path, @now)`
  ).run({
    id,
    booking: data.bookingId,
    email: normalizeEmail(data.customerEmail),
    kind: data.kind,
    path: data.path,
    now: new Date().toISOString(),
  });
  return getPhotoById(id)!;
}

export function getPhotoById(id: string): BookingPhoto | null {
  const row = getDb()
    .prepare("SELECT * FROM booking_photos WHERE id = ?")
    .get(id) as DbPhoto | undefined;
  return row ? toPhoto(row) : null;
}

export function getPhotosByBooking(bookingId: string): BookingPhoto[] {
  const rows = getDb()
    .prepare("SELECT * FROM booking_photos WHERE booking_id = ? ORDER BY kind, created_at")
    .all(bookingId) as DbPhoto[];
  return rows.map(toPhoto);
}

export function getPhotosByEmail(email: string): BookingPhoto[] {
  const rows = getDb()
    .prepare("SELECT * FROM booking_photos WHERE customer_email = ? ORDER BY created_at DESC")
    .all(normalizeEmail(email)) as DbPhoto[];
  return rows.map(toPhoto);
}

export function deletePhoto(id: string): BookingPhoto | null {
  const photo = getPhotoById(id);
  if (!photo) return null;
  getDb().prepare("DELETE FROM booking_photos WHERE id = ?").run(id);
  return photo;
}
