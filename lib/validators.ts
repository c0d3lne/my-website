import { z } from "zod";

const codeRegex = /^[A-Z0-9_-]{3,32}$/;

export const createCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .transform((v) => v.toUpperCase())
    .refine((v) => codeRegex.test(v), {
      message: "Code must be 3–32 chars, only A-Z 0-9 _ -",
    }),
  type: z.enum(["percent", "fixed"]),
  value: z.number().positive(),
  description: z.string().max(200).optional(),
  active: z.boolean().default(true),
  expiresAt: z.string().datetime().optional(),
  maxUses: z.number().int().positive().optional(),
});

export const updateCodeSchema = z.object({
  code: z
    .string()
    .min(3)
    .max(32)
    .transform((v) => v.toUpperCase())
    .refine((v) => codeRegex.test(v), {
      message: "Code must be 3–32 chars, only A-Z 0-9 _ -",
    })
    .optional(),
  type: z.enum(["percent", "fixed"]).optional(),
  value: z.number().positive().optional(),
  description: z.string().max(200).optional().nullable(),
  active: z.boolean().optional(),
  expiresAt: z.string().datetime().optional().nullable(),
  maxUses: z.number().int().positive().optional().nullable(),
});

export const loginSchema = z.object({
  password: z.string().min(1),
});

export const redeemSchema = z.object({
  code: z.string().min(1),
});

/* ── Customer accounts ─────────────────────────────────────── */
export const registerSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(8).max(200),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
});

export const customerLoginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const profileSchema = z.object({
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
});

/* ── Bookings ──────────────────────────────────────────────── */
export const createBookingSchema = z.object({
  customerEmail: z.string().email().max(200),
  name: z.string().max(120).optional(),
  phone: z.string().max(40).optional(),
  address: z.string().max(300).optional(),
  services: z.array(z.string().max(120)).max(20).optional(),
  notes: z.string().max(2000).optional(),
  travelArea: z.string().max(200).optional(),
  travelCharge: z.number().min(0).optional(),
  promoCode: z.string().max(40).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  time: z.string().max(20).optional(),
  subtotal: z.number().min(0).optional(),
  deposit: z.number().min(0).optional(),
});

export const bookingStatusSchema = z.object({
  status: z.enum(["pending", "confirmed", "completed", "cancelled"]),
});

// Admin booking update — status and/or deposit-paid flag (at least one).
export const bookingUpdateSchema = z
  .object({
    status: z.enum(["pending", "confirmed", "completed", "cancelled"]).optional(),
    depositPaid: z.boolean().optional(),
  })
  .refine((v) => v.status !== undefined || v.depositPaid !== undefined, {
    message: "Nothing to update",
  });

/* ── Invoices ──────────────────────────────────────────────── */
export const createInvoiceSchema = z.object({
  customerEmail: z.string().email().max(200),
  customerName: z.string().max(120).optional(),
  bookingId: z.string().max(64).optional(),
  amount: z.number().positive(),
  description: z.string().max(500).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  status: z.enum(["paid", "unpaid"]).optional(),
});

export const updateInvoiceSchema = z.object({
  amount: z.number().positive().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["paid", "unpaid"]).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  customerName: z.string().max(120).optional(),
  bookingId: z.string().max(64).nullable().optional(),
});

/* ── Calendar availability ─────────────────────────────────── */
export const availabilitySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  blocked: z.boolean(),
});

/* ── Travel areas & settings ───────────────────────────────── */
export const createTravelAreaSchema = z.object({
  name: z.string().min(1).max(120),
  postcodePrefix: z.string().max(12).optional(),
  charge: z.number().min(0),
});

export const updateTravelAreaSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  postcodePrefix: z.string().max(12).nullable().optional(),
  charge: z.number().min(0).optional(),
});

export const settingsSchema = z.object({
  default_travel_charge: z.number().min(0).optional(),
  referral_threshold: z.number().int().positive().optional(),
  reward_label: z.string().min(1).max(120).optional(),
});
