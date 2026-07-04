import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { randomUUID } from "crypto";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "gb.db");

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS discount_codes (
      id          TEXT PRIMARY KEY,
      code        TEXT NOT NULL UNIQUE,
      type        TEXT NOT NULL CHECK(type IN ('percent','fixed')),
      value       REAL NOT NULL,
      description TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      expires_at  TEXT,
      max_uses    INTEGER,
      used_count  INTEGER NOT NULL DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    );

    -- Customer accounts (created via the dashboard, only needed for referrals).
    CREATE TABLE IF NOT EXISTS customers (
      id            TEXT PRIMARY KEY,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT,
      phone         TEXT,
      address       TEXT,
      password_hash TEXT NOT NULL,
      referral_code TEXT NOT NULL UNIQUE,
      created_at    TEXT NOT NULL,
      updated_at    TEXT NOT NULL
    );

    -- Bookings placed from the public quote form (now persisted so we can
    -- prevent double bookings, attach invoices/photos, and track referrals).
    CREATE TABLE IF NOT EXISTS bookings (
      id             TEXT PRIMARY KEY,
      customer_email TEXT NOT NULL,
      name           TEXT,
      phone          TEXT,
      address        TEXT,
      services_json  TEXT NOT NULL DEFAULT '[]',
      notes          TEXT,
      travel_area    TEXT,
      travel_charge  REAL NOT NULL DEFAULT 0,
      promo_code     TEXT,
      date           TEXT,
      time           TEXT,
      subtotal       REAL NOT NULL DEFAULT 0,
      deposit        REAL NOT NULL DEFAULT 0,
      deposit_paid   INTEGER NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','confirmed','completed','cancelled')),
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS invoices (
      id                TEXT PRIMARY KEY,
      number            TEXT NOT NULL UNIQUE,
      customer_email    TEXT NOT NULL,
      customer_name     TEXT,
      booking_id        TEXT,
      amount            REAL NOT NULL,
      description       TEXT,
      status            TEXT NOT NULL DEFAULT 'unpaid'
                          CHECK(status IN ('paid','unpaid')),
      issued_date       TEXT NOT NULL,
      due_date          TEXT,
      paid_at           TEXT,
      stripe_session_id TEXT,
      created_at        TEXT NOT NULL,
      updated_at        TEXT NOT NULL
    );

    -- Before/after photos uploaded by the admin against a booking.
    CREATE TABLE IF NOT EXISTS booking_photos (
      id             TEXT PRIMARY KEY,
      booking_id     TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      kind           TEXT NOT NULL CHECK(kind IN ('before','after')),
      path           TEXT NOT NULL,
      created_at     TEXT NOT NULL
    );

    -- Referral tracking: one row per booking that used a customer's code.
    CREATE TABLE IF NOT EXISTS referrals (
      id             TEXT PRIMARY KEY,
      referrer_email TEXT NOT NULL,
      referral_code  TEXT NOT NULL,
      booking_id     TEXT NOT NULL UNIQUE,
      referred_email TEXT,
      status         TEXT NOT NULL DEFAULT 'pending'
                       CHECK(status IN ('pending','completed','cancelled')),
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    );

    -- Individual calendar days the admin has switched off. Absence = available.
    CREATE TABLE IF NOT EXISTS unavailable_days (
      date       TEXT PRIMARY KEY,
      created_at TEXT NOT NULL
    );

    -- Editable travel-charge areas. charge = 0 means included (no travel fee).
    CREATE TABLE IF NOT EXISTS travel_areas (
      id              TEXT PRIMARY KEY,
      name            TEXT NOT NULL,
      postcode_prefix TEXT,
      charge          REAL NOT NULL DEFAULT 0,
      sort            INTEGER NOT NULL DEFAULT 0,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Additive migrations for databases created before a column existed.
  addColumnIfMissing(db, "bookings", "deposit_paid", "INTEGER NOT NULL DEFAULT 0");

  seedDefaults(db);
}

// SQLite has no "ADD COLUMN IF NOT EXISTS", so check the table shape first.
function addColumnIfMissing(
  db: Database.Database,
  table: string,
  column: string,
  ddl: string
) {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
  if (!cols.some((c) => c.name === column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${ddl}`);
  }
}

// One-time seeds — only inserted when the relevant tables are empty, so the
// admin can freely edit/delete afterwards without them coming back.
function seedDefaults(db: Database.Database) {
  const now = new Date().toISOString();

  const areaCount = (
    db.prepare("SELECT COUNT(*) AS n FROM travel_areas").get() as { n: number }
  ).n;
  if (areaCount === 0) {
    const insert = db.prepare(
      `INSERT INTO travel_areas (id, name, postcode_prefix, charge, sort, created_at, updated_at)
       VALUES (@id, @name, @prefix, @charge, @sort, @now, @now)`
    );
    const included = [
      { name: "Warboys", prefix: "PE28" },
      { name: "Ramsey", prefix: "PE26" },
      { name: "Upwood", prefix: "PE26" },
    ];
    included.forEach((a, i) =>
      insert.run({
        id: randomId(),
        name: a.name,
        prefix: a.prefix,
        charge: 0,
        sort: i,
        now,
      })
    );
  }

  const defaults: Record<string, string> = {
    default_travel_charge: "15",
    referral_threshold: "5",
    reward_label: "One free exterior wash",
  };
  const getSetting = db.prepare("SELECT value FROM settings WHERE key = ?");
  const putSetting = db.prepare(
    "INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)"
  );
  for (const [k, v] of Object.entries(defaults)) {
    if (!getSetting.get(k)) putSetting.run(k, v);
  }
}

// Short, URL/analytics-safe unique id (used for seeded rows and elsewhere).
export function randomId(): string {
  return randomUUID();
}

export type DbCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description: string | null;
  active: number;
  expires_at: string | null;
  max_uses: number | null;
  used_count: number;
  created_at: string;
  updated_at: string;
};

export type DiscountCode = {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description?: string;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
  usedCount: number;
  createdAt: string;
  updatedAt: string;
};

function rowToCode(row: DbCode): DiscountCode {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    value: row.value,
    description: row.description ?? undefined,
    active: row.active === 1,
    expiresAt: row.expires_at ?? undefined,
    maxUses: row.max_uses ?? undefined,
    usedCount: row.used_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function isValid(row: DbCode): boolean {
  if (row.active !== 1) return false;
  if (row.expires_at && new Date(row.expires_at) <= new Date()) return false;
  if (row.max_uses !== null && row.used_count >= row.max_uses) return false;
  return true;
}

export function getAllCodes(): DiscountCode[] {
  const db = getDb();
  const rows = db
    .prepare("SELECT * FROM discount_codes ORDER BY created_at DESC")
    .all() as DbCode[];
  return rows.map(rowToCode);
}

export function findValidCode(raw: string): DiscountCode | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discount_codes WHERE code = ?")
    .get(raw.toUpperCase().trim()) as DbCode | undefined;
  if (!row || !isValid(row)) return null;
  return rowToCode(row);
}

export function getCodeById(id: string): DiscountCode | null {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discount_codes WHERE id = ?")
    .get(id) as DbCode | undefined;
  return row ? rowToCode(row) : null;
}

export function createCode(data: {
  id: string;
  code: string;
  type: "percent" | "fixed";
  value: number;
  description?: string;
  active: boolean;
  expiresAt?: string;
  maxUses?: number;
}): DiscountCode {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO discount_codes
       (id, code, type, value, description, active, expires_at, max_uses, used_count, created_at, updated_at)
     VALUES
       (@id, @code, @type, @value, @description, @active, @expiresAt, @maxUses, 0, @now, @now)`
  ).run({
    id: data.id,
    code: data.code.toUpperCase(),
    type: data.type,
    value: data.value,
    description: data.description ?? null,
    active: data.active ? 1 : 0,
    expiresAt: data.expiresAt ?? null,
    maxUses: data.maxUses ?? null,
    now,
  });
  return getCodeById(data.id)!;
}

export function updateCode(
  id: string,
  data: Partial<{
    code: string;
    type: "percent" | "fixed";
    value: number;
    description: string;
    active: boolean;
    expiresAt: string;
    maxUses: number;
  }>
): DiscountCode | null {
  const db = getDb();
  const now = new Date().toISOString();

  const fields: string[] = ["updated_at = @now"];
  const params: Record<string, unknown> = { id, now };

  if (data.code !== undefined) { fields.push("code = @code"); params.code = data.code.toUpperCase(); }
  if (data.type !== undefined) { fields.push("type = @type"); params.type = data.type; }
  if (data.value !== undefined) { fields.push("value = @value"); params.value = data.value; }
  if ("description" in data) { fields.push("description = @description"); params.description = data.description ?? null; }
  if (data.active !== undefined) { fields.push("active = @active"); params.active = data.active ? 1 : 0; }
  if ("expiresAt" in data) { fields.push("expires_at = @expiresAt"); params.expiresAt = data.expiresAt ?? null; }
  if ("maxUses" in data) { fields.push("max_uses = @maxUses"); params.maxUses = data.maxUses ?? null; }

  db.prepare(`UPDATE discount_codes SET ${fields.join(", ")} WHERE id = @id`).run(params);
  return getCodeById(id);
}

export function deleteCode(id: string): boolean {
  const db = getDb();
  const result = db.prepare("DELETE FROM discount_codes WHERE id = ?").run(id);
  return result.changes > 0;
}

export function incrementUsedCount(code: string): void {
  const db = getDb();
  const row = db
    .prepare("SELECT * FROM discount_codes WHERE code = ?")
    .get(code.toUpperCase().trim()) as DbCode | undefined;
  if (!row || !isValid(row)) return;
  db.prepare(
    "UPDATE discount_codes SET used_count = used_count + 1, updated_at = ? WHERE id = ?"
  ).run(new Date().toISOString(), row.id);
}
