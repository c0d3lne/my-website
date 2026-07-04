import { getDb, randomId } from "./db";
import { normalizeEmail, getCustomerByReferralCode } from "./customers";

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Booking = {
  id: string;
  customerEmail: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  services: string[];
  notes: string | null;
  travelArea: string | null;
  travelCharge: number;
  promoCode: string | null;
  date: string | null;
  time: string | null;
  subtotal: number;
  deposit: number;
  depositPaid: boolean;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
};

type DbBooking = {
  id: string;
  customer_email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  services_json: string;
  notes: string | null;
  travel_area: string | null;
  travel_charge: number;
  promo_code: string | null;
  date: string | null;
  time: string | null;
  subtotal: number;
  deposit: number;
  deposit_paid: number;
  status: BookingStatus;
  created_at: string;
  updated_at: string;
};

function toBooking(row: DbBooking): Booking {
  let services: string[] = [];
  try {
    const parsed = JSON.parse(row.services_json);
    if (Array.isArray(parsed)) services = parsed;
  } catch {
    /* leave empty */
  }
  return {
    id: row.id,
    customerEmail: row.customer_email,
    name: row.name,
    phone: row.phone,
    address: row.address,
    services,
    notes: row.notes,
    travelArea: row.travel_area,
    travelCharge: row.travel_charge,
    promoCode: row.promo_code,
    date: row.date,
    time: row.time,
    subtotal: row.subtotal,
    deposit: row.deposit,
    depositPaid: row.deposit_paid === 1,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// Parse a booking's date + slot ("11:00am") into a concrete start time.
function bookingStartTime(b: Booking): Date | null {
  if (!b.date) return null;
  const [y, m, d] = b.date.split("-").map(Number);
  let hh = 0;
  let mm = 0;
  if (b.time) {
    const mt = b.time.match(/(\d+):(\d+)\s*(am|pm)/i);
    if (mt) {
      hh = Number(mt[1]) % 12;
      if (/pm/i.test(mt[3])) hh += 12;
      mm = Number(mt[2]);
    }
  }
  return new Date(y, m - 1, d, hh, mm);
}

// Single source of truth for whether a customer may cancel a booking online.
//   • ≥ 48h notice → cancel allowed, deposit REFUNDABLE
//   • 24–48h notice → cancel allowed, deposit FORFEITED (non-refundable)
//   • < 24h notice  → no online self-cancel (contact us) — stops last-minute drops
// A booking with no scheduled date is treated as full notice (refundable).
export const CANCEL_NOTICE_HOURS = 24; // below this, self-cancel is blocked
export const DEPOSIT_REFUND_HOURS = 48; // at/above this, the deposit is refunded

export function cancellationInfo(b: Booking): {
  cancellable: boolean;
  depositRefundable: boolean;
  reason: string;
} {
  if (b.status === "cancelled")
    return { cancellable: false, depositRefundable: false, reason: "This booking is already cancelled." };
  if (b.status === "completed")
    return { cancellable: false, depositRefundable: false, reason: "This booking is already completed." };

  const start = bookingStartTime(b);
  const hoursUntil = start ? (start.getTime() - Date.now()) / 3_600_000 : Infinity;

  if (hoursUntil < CANCEL_NOTICE_HOURS) {
    return {
      cancellable: false,
      depositRefundable: false,
      reason: `Cancellations within ${CANCEL_NOTICE_HOURS} hours aren't available online — please contact us. Your deposit is non-refundable.`,
    };
  }
  if (hoursUntil < DEPOSIT_REFUND_HOURS) {
    return {
      cancellable: true,
      depositRefundable: false,
      reason: `Cancelling now (under ${DEPOSIT_REFUND_HOURS} hours' notice) means your 10% deposit is non-refundable.`,
    };
  }
  return {
    cancellable: true,
    depositRefundable: true,
    reason: `You're cancelling with more than ${DEPOSIT_REFUND_HOURS} hours' notice, so your 10% deposit will be refunded.`,
  };
}

export function setDepositPaid(id: string, paid: boolean): Booking | null {
  getDb()
    .prepare("UPDATE bookings SET deposit_paid = ?, updated_at = ? WHERE id = ?")
    .run(paid ? 1 : 0, new Date().toISOString(), id);
  return getBookingById(id);
}

// A slot is taken if any non-cancelled booking holds that exact date + time.
export function isSlotTaken(date: string, time: string, excludeId?: string): boolean {
  const row = getDb()
    .prepare(
      `SELECT 1 FROM bookings
       WHERE date = @date AND time = @time AND status != 'cancelled'
         AND (@exclude IS NULL OR id != @exclude)
       LIMIT 1`
    )
    .get({ date, time, exclude: excludeId ?? null });
  return !!row;
}

// All non-cancelled taken times for a given date (for the public calendar).
export function takenTimesForDate(date: string): string[] {
  const rows = getDb()
    .prepare(
      `SELECT time FROM bookings
       WHERE date = ? AND status != 'cancelled' AND time IS NOT NULL`
    )
    .all(date) as Array<{ time: string }>;
  return rows.map((r) => r.time);
}

export function createBooking(data: {
  customerEmail: string;
  name?: string;
  phone?: string;
  address?: string;
  services?: string[];
  notes?: string;
  travelArea?: string;
  travelCharge?: number;
  promoCode?: string;
  date?: string;
  time?: string;
  subtotal?: number;
  deposit?: number;
}): Booking {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomId();
  const email = normalizeEmail(data.customerEmail);

  db.prepare(
    `INSERT INTO bookings
       (id, customer_email, name, phone, address, services_json, notes,
        travel_area, travel_charge, promo_code, date, time, subtotal, deposit,
        status, created_at, updated_at)
     VALUES
       (@id, @email, @name, @phone, @address, @services, @notes,
        @travelArea, @travelCharge, @promoCode, @date, @time, @subtotal, @deposit,
        'pending', @now, @now)`
  ).run({
    id,
    email,
    name: data.name ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    services: JSON.stringify(data.services ?? []),
    notes: data.notes ?? null,
    travelArea: data.travelArea ?? null,
    travelCharge: data.travelCharge ?? 0,
    promoCode: data.promoCode ? data.promoCode.trim().toUpperCase() : null,
    date: data.date ?? null,
    time: data.time ?? null,
    subtotal: data.subtotal ?? 0,
    deposit: data.deposit ?? 0,
    now,
  });

  // If the promo code belongs to another customer's referral code, record a
  // pending referral. It only becomes "successful" once this booking completes.
  if (data.promoCode) {
    const referrer = getCustomerByReferralCode(data.promoCode);
    if (referrer && referrer.email !== email) {
      db.prepare(
        `INSERT OR IGNORE INTO referrals
           (id, referrer_email, referral_code, booking_id, referred_email, status, created_at, updated_at)
         VALUES (@id, @referrer, @code, @booking, @referred, 'pending', @now, @now)`
      ).run({
        id: randomId(),
        referrer: referrer.email,
        code: referrer.referralCode,
        booking: id,
        referred: email,
        now,
      });
    }
  }

  return getBookingById(id)!;
}

export function getBookingById(id: string): Booking | null {
  const row = getDb()
    .prepare("SELECT * FROM bookings WHERE id = ?")
    .get(id) as DbBooking | undefined;
  return row ? toBooking(row) : null;
}

export function getAllBookings(): Booking[] {
  const rows = getDb()
    .prepare("SELECT * FROM bookings ORDER BY created_at DESC")
    .all() as DbBooking[];
  return rows.map(toBooking);
}

export function getBookingsByEmail(email: string): Booking[] {
  const rows = getDb()
    .prepare(
      "SELECT * FROM bookings WHERE customer_email = ? ORDER BY created_at DESC"
    )
    .all(normalizeEmail(email)) as DbBooking[];
  return rows.map(toBooking);
}

// Changing a booking's status cascades to any referral tied to it.
export function updateBookingStatus(
  id: string,
  status: BookingStatus
): Booking | null {
  const db = getDb();
  const now = new Date().toISOString();
  const existing = getBookingById(id);
  if (!existing) return null;

  db.prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?").run(
    status,
    now,
    id
  );

  const referralStatus =
    status === "completed"
      ? "completed"
      : status === "cancelled"
      ? "cancelled"
      : "pending";
  db.prepare(
    "UPDATE referrals SET status = ?, updated_at = ? WHERE booking_id = ?"
  ).run(referralStatus, now, id);

  return getBookingById(id);
}
