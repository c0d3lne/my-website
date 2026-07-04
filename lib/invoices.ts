import { getDb, randomId } from "./db";
import { normalizeEmail } from "./customers";

// Stored status is paid|unpaid. "overdue" is derived at read time from the due
// date so it stays correct without a background job.
export type InvoiceStatus = "paid" | "unpaid" | "overdue";

export type Invoice = {
  id: string;
  number: string;
  customerEmail: string;
  customerName: string | null;
  bookingId: string | null;
  amount: number;
  description: string | null;
  status: InvoiceStatus;
  issuedDate: string;
  dueDate: string | null;
  paidAt: string | null;
  stripeSessionId: string | null;
  createdAt: string;
  updatedAt: string;
};

type DbInvoice = {
  id: string;
  number: string;
  customer_email: string;
  customer_name: string | null;
  booking_id: string | null;
  amount: number;
  description: string | null;
  status: "paid" | "unpaid";
  issued_date: string;
  due_date: string | null;
  paid_at: string | null;
  stripe_session_id: string | null;
  created_at: string;
  updated_at: string;
};

function deriveStatus(row: DbInvoice): InvoiceStatus {
  if (row.status === "paid") return "paid";
  if (row.due_date) {
    const due = new Date(row.due_date + "T23:59:59");
    if (due.getTime() < Date.now()) return "overdue";
  }
  return "unpaid";
}

function toInvoice(row: DbInvoice): Invoice {
  return {
    id: row.id,
    number: row.number,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    bookingId: row.booking_id,
    amount: row.amount,
    description: row.description,
    status: deriveStatus(row),
    issuedDate: row.issued_date,
    dueDate: row.due_date,
    paidAt: row.paid_at,
    stripeSessionId: row.stripe_session_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function nextInvoiceNumber(): string {
  const row = getDb()
    .prepare("SELECT COUNT(*) AS n FROM invoices")
    .get() as { n: number };
  return `INV-${String(row.n + 1).padStart(4, "0")}`;
}

export function getInvoiceById(id: string): Invoice | null {
  const row = getDb()
    .prepare("SELECT * FROM invoices WHERE id = ?")
    .get(id) as DbInvoice | undefined;
  return row ? toInvoice(row) : null;
}

export function getAllInvoices(): Invoice[] {
  const rows = getDb()
    .prepare("SELECT * FROM invoices ORDER BY created_at DESC")
    .all() as DbInvoice[];
  return rows.map(toInvoice);
}

export function getInvoicesByEmail(email: string): Invoice[] {
  const rows = getDb()
    .prepare("SELECT * FROM invoices WHERE customer_email = ? ORDER BY created_at DESC")
    .all(normalizeEmail(email)) as DbInvoice[];
  return rows.map(toInvoice);
}

export function getInvoicesByBooking(bookingId: string): Invoice[] {
  const rows = getDb()
    .prepare("SELECT * FROM invoices WHERE booking_id = ? ORDER BY created_at DESC")
    .all(bookingId) as DbInvoice[];
  return rows.map(toInvoice);
}

export function createInvoice(data: {
  customerEmail: string;
  customerName?: string;
  bookingId?: string;
  amount: number;
  description?: string;
  dueDate?: string;
  issuedDate?: string;
  status?: "paid" | "unpaid";
}): Invoice {
  const db = getDb();
  const now = new Date().toISOString();
  const id = randomId();
  db.prepare(
    `INSERT INTO invoices
       (id, number, customer_email, customer_name, booking_id, amount, description,
        status, issued_date, due_date, paid_at, stripe_session_id, created_at, updated_at)
     VALUES
       (@id, @number, @email, @name, @booking, @amount, @description,
        @status, @issued, @due, @paidAt, NULL, @now, @now)`
  ).run({
    id,
    number: nextInvoiceNumber(),
    email: normalizeEmail(data.customerEmail),
    name: data.customerName ?? null,
    booking: data.bookingId ?? null,
    amount: data.amount,
    description: data.description ?? null,
    status: data.status ?? "unpaid",
    issued: data.issuedDate ?? now.slice(0, 10),
    due: data.dueDate ?? null,
    paidAt: data.status === "paid" ? now : null,
    now,
  });
  return getInvoiceById(id)!;
}

export function updateInvoice(
  id: string,
  data: Partial<{
    amount: number;
    description: string | null;
    status: "paid" | "unpaid";
    dueDate: string | null;
    customerName: string;
    bookingId: string | null;
  }>
): Invoice | null {
  const db = getDb();
  const now = new Date().toISOString();
  const fields: string[] = ["updated_at = @now"];
  const params: Record<string, unknown> = { id, now };
  if (data.amount !== undefined) { fields.push("amount = @amount"); params.amount = data.amount; }
  if ("description" in data) { fields.push("description = @description"); params.description = data.description ?? null; }
  if (data.status !== undefined) {
    fields.push("status = @status");
    params.status = data.status;
    fields.push("paid_at = @paidAt");
    params.paidAt = data.status === "paid" ? now : null;
  }
  if ("dueDate" in data) { fields.push("due_date = @due"); params.due = data.dueDate ?? null; }
  if (data.customerName !== undefined) { fields.push("customer_name = @name"); params.name = data.customerName; }
  if ("bookingId" in data) { fields.push("booking_id = @booking"); params.booking = data.bookingId ?? null; }
  db.prepare(`UPDATE invoices SET ${fields.join(", ")} WHERE id = @id`).run(params);
  return getInvoiceById(id);
}

export function markInvoicePaid(id: string, stripeSessionId?: string): Invoice | null {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `UPDATE invoices
     SET status = 'paid', paid_at = @now, updated_at = @now,
         stripe_session_id = COALESCE(@session, stripe_session_id)
     WHERE id = @id`
  ).run({ id, now, session: stripeSessionId ?? null });
  return getInvoiceById(id);
}

export function attachStripeSession(id: string, sessionId: string): void {
  getDb()
    .prepare("UPDATE invoices SET stripe_session_id = ?, updated_at = ? WHERE id = ?")
    .run(sessionId, new Date().toISOString(), id);
}

export function deleteInvoice(id: string): boolean {
  return getDb().prepare("DELETE FROM invoices WHERE id = ?").run(id).changes > 0;
}
