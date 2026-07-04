"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type Invoice = {
  id: string;
  number: string;
  customerEmail: string;
  customerName: string | null;
  bookingId: string | null;
  amount: number;
  description: string | null;
  status: "paid" | "unpaid" | "overdue";
  issuedDate: string;
  dueDate: string | null;
};

type FormState = {
  customerEmail: string;
  customerName: string;
  amount: string;
  description: string;
  dueDate: string;
  bookingId: string;
  status: "paid" | "unpaid";
};

const emptyForm: FormState = {
  customerEmail: "",
  customerName: "",
  amount: "",
  description: "",
  dueDate: "",
  bookingId: "",
  status: "unpaid",
};

const fmt = (n: number) => `£${n.toFixed(2)}`;
const statusPill: Record<string, string> = {
  paid: "a-pill-green",
  unpaid: "a-pill-amber",
  overdue: "a-pill-red",
};
function dateFmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function InvoicesInner() {
  const router = useRouter();
  const search = useSearchParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Invoice | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/invoices");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setInvoices(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  // Prefill + open the create modal when linked from a booking.
  useEffect(() => {
    if (search.get("email")) {
      setEditingId(null);
      setForm({
        ...emptyForm,
        customerEmail: search.get("email") ?? "",
        customerName: search.get("name") ?? "",
        amount: search.get("amount") ?? "",
        bookingId: search.get("bookingId") ?? "",
      });
      setModalOpen(true);
      router.replace("/admin/invoices");
    }
  }, [search, router]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(inv: Invoice) {
    setEditingId(inv.id);
    setForm({
      customerEmail: inv.customerEmail,
      customerName: inv.customerName ?? "",
      amount: String(inv.amount),
      description: inv.description ?? "",
      dueDate: inv.dueDate ?? "",
      bookingId: inv.bookingId ?? "",
      status: inv.status === "paid" ? "paid" : "unpaid",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    const payload: Record<string, unknown> = {
      customerEmail: form.customerEmail,
      amount: parseFloat(form.amount),
      status: form.status,
    };
    if (form.customerName) payload.customerName = form.customerName;
    if (form.description) payload.description = form.description;
    if (form.dueDate) payload.dueDate = form.dueDate;
    if (form.bookingId) payload.bookingId = form.bookingId;

    try {
      const url = editingId ? `/api/admin/invoices/${editingId}` : "/api/admin/invoices";
      const res = await fetch(url, {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error ?? "Something went wrong"); return; }
      setModalOpen(false);
      load();
    } catch {
      setFormError("Network error — try again.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePaid(inv: Invoice) {
    await fetch(`/api/admin/invoices/${inv.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: inv.status === "paid" ? "unpaid" : "paid" }),
    });
    load();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    await fetch(`/api/admin/invoices/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    load();
  }

  function emailInvoice(inv: Invoice) {
    const link = `${window.location.origin}/invoices/${inv.id}`;
    const subject = `Invoice ${inv.number} from GB Detailing`;
    const body =
      `Hi ${inv.customerName ?? ""},\n\n` +
      `Please find your invoice ${inv.number} for ${fmt(inv.amount)}${inv.dueDate ? `, due ${dateFmt(inv.dueDate)}` : ""}.\n\n` +
      `View, download or pay it here:\n${link}\n\n` +
      `Thanks,\nGB Detailing`;
    window.location.href = `mailto:${inv.customerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-semibold">Invoices</h2>
          <p className="text-white/40 text-sm mt-0.5">Create, email and track invoices. They appear in the customer&apos;s dashboard automatically.</p>
        </div>
        <button onClick={openNew} className="a-btn">+ New invoice</button>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
      ) : invoices.length === 0 ? (
        <div className="text-center py-24 text-white/30">No invoices yet.</div>
      ) : (
        <div className="a-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Invoice", "Customer", "Amount", "Status", "Issued", "Due", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-white/30 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-white font-mono" style={{ fontFamily: "var(--font-geist-mono)" }}>{inv.number}</td>
                  <td className="px-5 py-4">
                    <div className="text-white">{inv.customerName ?? "—"}</div>
                    <div className="text-white/40 text-xs">{inv.customerEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-white/80">{fmt(inv.amount)}</td>
                  <td className="px-5 py-4"><span className={`a-pill ${statusPill[inv.status]}`}>{inv.status}</span></td>
                  <td className="px-5 py-4 text-white/50">{dateFmt(inv.issuedDate)}</td>
                  <td className="px-5 py-4 text-white/50">{dateFmt(inv.dueDate)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button onClick={() => togglePaid(inv)} className="a-btn-ghost !py-1.5 !px-2.5 !text-xs">
                        {inv.status === "paid" ? "Mark unpaid" : "Mark paid"}
                      </button>
                      <button onClick={() => emailInvoice(inv)} className="a-btn-ghost !py-1.5 !px-2.5 !text-xs">Email</button>
                      <a href={`/invoices/${inv.id}`} target="_blank" rel="noreferrer" className="a-btn-ghost !py-1.5 !px-2.5 !text-xs">PDF</a>
                      <button onClick={() => openEdit(inv)} className="a-btn-ghost !py-1.5 !px-2.5 !text-xs">Edit</button>
                      <button onClick={() => setDeleteTarget(inv)} className="a-btn-danger">Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <div className="a-scrim" onClick={(e) => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="a-modal max-w-md">
            <h2 className="text-white text-lg font-semibold mb-6">{editingId ? "Edit invoice" : "New invoice"}</h2>
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="a-label">Customer email</label>
                <input type="email" required className="a-field" value={form.customerEmail}
                  onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} placeholder="customer@example.com" />
              </div>
              <div>
                <label className="a-label">Customer name (optional)</label>
                <input type="text" className="a-field" value={form.customerName}
                  onChange={(e) => setForm({ ...form, customerName: e.target.value })} placeholder="John Smith" />
              </div>
              <div>
                <label className="a-label">Amount (£)</label>
                <input type="number" required min="0.01" step="0.01" className="a-field" value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="45.00" />
              </div>
              <div>
                <label className="a-label">Description (optional)</label>
                <input type="text" className="a-field" value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Exterior + interior clean" />
              </div>
              <div>
                <label className="a-label">Due date (optional)</label>
                <input type="date" className="a-field" value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <input id="inv-paid" type="checkbox" className="w-4 h-4 accent-[var(--accent)]"
                  checked={form.status === "paid"}
                  onChange={(e) => setForm({ ...form, status: e.target.checked ? "paid" : "unpaid" })} />
                <label htmlFor="inv-paid" className="text-sm text-white/70 cursor-pointer">Mark as already paid</label>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={saving} className="a-btn flex-1 !py-2.5">
                  {saving ? "Saving…" : editingId ? "Save changes" : "Create invoice"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="a-btn-ghost !py-2.5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="a-scrim">
          <div className="a-modal max-w-sm">
            <h2 className="text-white text-lg font-semibold mb-2">Delete invoice?</h2>
            <p className="text-white/50 text-sm mb-6">
              Delete <span className="text-white font-mono" style={{ fontFamily: "var(--font-geist-mono)" }}>{deleteTarget.number}</span>? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors">Delete</button>
              <button onClick={() => setDeleteTarget(null)} className="a-btn-ghost !py-2.5">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function AdminInvoices() {
  return (
    <Suspense fallback={<div className="text-white/40 text-sm py-20 text-center">Loading…</div>}>
      <InvoicesInner />
    </Suspense>
  );
}
