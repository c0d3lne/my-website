import { getDb, randomId } from "./db";
import { hashPassword } from "./hash";
import { randomBytes } from "crypto";

export type Customer = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  referralCode: string;
  createdAt: string;
  updatedAt: string;
};

type DbCustomer = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  address: string | null;
  password_hash: string;
  referral_code: string;
  created_at: string;
  updated_at: string;
};

function toCustomer(row: DbCustomer): Customer {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    phone: row.phone,
    address: row.address,
    referralCode: row.referral_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

// Referral codes are short, human-readable, and guaranteed unique.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
function makeReferralCode(name?: string): string {
  const base = (name ?? "")
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
  let suffix = "";
  const bytes = randomBytes(5);
  for (const b of bytes) suffix += CODE_ALPHABET[b % CODE_ALPHABET.length];
  return `${base || "GB"}-${suffix}`;
}

function generateUniqueReferralCode(name?: string): string {
  const db = getDb();
  const exists = db.prepare("SELECT 1 FROM customers WHERE referral_code = ?");
  for (let attempt = 0; attempt < 20; attempt++) {
    const code = makeReferralCode(name);
    if (!exists.get(code)) return code;
  }
  // Extremely unlikely; fall back to a UUID-derived code.
  return `GB-${randomId().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function getCustomerByEmail(email: string): Customer | null {
  const row = getDb()
    .prepare("SELECT * FROM customers WHERE email = ?")
    .get(normalizeEmail(email)) as DbCustomer | undefined;
  return row ? toCustomer(row) : null;
}

export function getCustomerById(id: string): Customer | null {
  const row = getDb()
    .prepare("SELECT * FROM customers WHERE id = ?")
    .get(id) as DbCustomer | undefined;
  return row ? toCustomer(row) : null;
}

export function getCustomerByReferralCode(code: string): Customer | null {
  const row = getDb()
    .prepare("SELECT * FROM customers WHERE referral_code = ?")
    .get(code.trim().toUpperCase()) as DbCustomer | undefined;
  return row ? toCustomer(row) : null;
}

export function getPasswordHash(email: string): string | null {
  const row = getDb()
    .prepare("SELECT password_hash FROM customers WHERE email = ?")
    .get(normalizeEmail(email)) as { password_hash: string } | undefined;
  return row?.password_hash ?? null;
}

export function createCustomer(data: {
  email: string;
  password: string;
  name?: string;
  phone?: string;
  address?: string;
}): Customer {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomId();
  const referralCode = generateUniqueReferralCode(data.name);
  db.prepare(
    `INSERT INTO customers
       (id, email, name, phone, address, password_hash, referral_code, created_at, updated_at)
     VALUES
       (@id, @email, @name, @phone, @address, @hash, @code, @now, @now)`
  ).run({
    id,
    email: normalizeEmail(data.email),
    name: data.name ?? null,
    phone: data.phone ?? null,
    address: data.address ?? null,
    hash: hashPassword(data.password),
    code: referralCode,
    now,
  });
  return getCustomerById(id)!;
}

export function updateCustomerProfile(
  id: string,
  data: Partial<{ name: string; phone: string; address: string }>
): Customer | null {
  const db = getDb();
  const fields: string[] = ["updated_at = @now"];
  const params: Record<string, unknown> = { id, now: new Date().toISOString() };
  if (data.name !== undefined) { fields.push("name = @name"); params.name = data.name; }
  if (data.phone !== undefined) { fields.push("phone = @phone"); params.phone = data.phone; }
  if (data.address !== undefined) { fields.push("address = @address"); params.address = data.address; }
  db.prepare(`UPDATE customers SET ${fields.join(", ")} WHERE id = @id`).run(params);
  return getCustomerById(id);
}

export function getAllCustomers(): Customer[] {
  const rows = getDb()
    .prepare("SELECT * FROM customers ORDER BY created_at DESC")
    .all() as DbCustomer[];
  return rows.map(toCustomer);
}
