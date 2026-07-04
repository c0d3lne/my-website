"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";

type DiscountCode = {
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

type FormData = {
  code: string;
  type: "percent" | "fixed";
  value: string;
  description: string;
  active: boolean;
  expiresAt: string;
  maxUses: string;
};

const emptyForm: FormData = {
  code: "",
  type: "percent",
  value: "",
  description: "",
  active: true,
  expiresAt: "",
  maxUses: "",
};

function formatValue(code: DiscountCode) {
  return code.type === "percent" ? `${code.value}%` : `£${code.value.toFixed(2)}`;
}

function formatExpiry(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminCodes() {
  const router = useRouter();
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DiscountCode | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCodes = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/codes");
      if (res.status === 401) { router.push("/admin/login"); return; }
      const data = await res.json();
      setCodes(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { loadCodes(); }, [loadCodes]);

  function openNew() {
    setEditingId(null);
    setForm(emptyForm);
    setFormError("");
    setModalOpen(true);
  }

  function openEdit(code: DiscountCode) {
    setEditingId(code.id);
    setForm({
      code: code.code,
      type: code.type,
      value: String(code.value),
      description: code.description ?? "",
      active: code.active,
      expiresAt: code.expiresAt ? code.expiresAt.slice(0, 16) : "",
      maxUses: code.maxUses !== undefined ? String(code.maxUses) : "",
    });
    setFormError("");
    setModalOpen(true);
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormLoading(true);
    setFormError("");

    const payload: Record<string, unknown> = {
      code: form.code,
      type: form.type,
      value: parseFloat(form.value),
      active: form.active,
    };
    if (form.description) payload.description = form.description;
    if (form.expiresAt) payload.expiresAt = new Date(form.expiresAt).toISOString();
    if (form.maxUses) payload.maxUses = parseInt(form.maxUses, 10);

    try {
      const url = editingId ? `/api/admin/codes/${editingId}` : "/api/admin/codes";
      const method = editingId ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error ?? "Something went wrong");
        return;
      }
      setModalOpen(false);
      loadCodes();
    } catch {
      setFormError("Network error — try again.");
    } finally {
      setFormLoading(false);
    }
  }

  async function toggleActive(code: DiscountCode) {
    await fetch(`/api/admin/codes/${code.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !code.active }),
    });
    loadCodes();
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    await fetch(`/api/admin/codes/${deleteTarget.id}`, { method: "DELETE" });
    setDeleteTarget(null);
    setDeleteLoading(false);
    loadCodes();
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-white text-xl font-semibold">Discount Codes</h2>
          <p className="text-white/40 text-sm mt-0.5">Promo codes for the booking form.</p>
        </div>
        <button onClick={openNew} className="a-btn">+ New code</button>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
      ) : codes.length === 0 ? (
        <div className="text-center py-24">
          <p className="text-white/30 text-lg mb-2">No codes yet</p>
          <p className="text-white/20 text-sm">Create your first one with the button above.</p>
        </div>
      ) : (
        <div className="a-card rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Code", "Type", "Value", "Active", "Used", "Expires", "Actions"].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-white/30 font-medium text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-4">
                    <span className="text-white font-medium tracking-wide" style={{ fontFamily: "var(--font-geist-mono)" }}>
                      {c.code}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className={`a-pill ${c.type === "percent" ? "a-pill-blue" : "a-pill-green"}`}>
                      {c.type === "percent" ? "Percent" : "Fixed"}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-white/80">{formatValue(c)}</td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => toggleActive(c)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        c.active ? "bg-[var(--accent)]" : "bg-white/20"
                      }`}
                      aria-label={c.active ? "Deactivate" : "Activate"}
                    >
                      <span
                        className="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform"
                        style={{ transform: c.active ? "translateX(18px)" : "translateX(2px)" }}
                      />
                    </button>
                  </td>
                  <td className="px-5 py-4 text-white/50" style={{ fontFamily: "var(--font-geist-mono)" }}>
                    {c.usedCount} / {c.maxUses ?? "∞"}
                  </td>
                  <td className="px-5 py-4 text-white/50">{formatExpiry(c.expiresAt)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(c)} className="a-btn-ghost !py-1.5 !px-3 !text-xs">Edit</button>
                      <button onClick={() => setDeleteTarget(c)} className="a-btn-danger">Delete</button>
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
            <h2 className="text-white text-lg font-semibold mb-6">
              {editingId ? "Edit code" : "New discount code"}
            </h2>
            <form onSubmit={handleFormSubmit} className="space-y-5">
              <div>
                <label className="a-label">Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  className="a-field"
                  placeholder="e.g. LOYAL15"
                  pattern="[A-Z0-9_\-]{3,32}"
                  required
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                />
              </div>
              <div>
                <label className="a-label">Type</label>
                <div className="flex gap-3 mt-1">
                  {(["percent", "fixed"] as const).map((t) => (
                    <label key={t} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="type"
                        value={t}
                        checked={form.type === t}
                        onChange={() => setForm({ ...form, type: t })}
                        className="accent-[var(--accent)]"
                      />
                      <span className={form.type === t ? "text-white" : "text-white/50"}>
                        {t === "percent" ? "Percent off" : "Fixed £ off"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="a-label">Value {form.type === "percent" ? "(%)" : "(£)"}</label>
                <input
                  type="number"
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  className="a-field"
                  placeholder={form.type === "percent" ? "e.g. 15" : "e.g. 10.00"}
                  min="0.01"
                  step={form.type === "percent" ? "1" : "0.01"}
                  required
                />
              </div>
              <div>
                <label className="a-label">Description (optional)</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="a-field"
                  placeholder="e.g. Loyalty reward"
                />
              </div>
              <div>
                <label className="a-label">Expires at (optional)</label>
                <input
                  type="datetime-local"
                  value={form.expiresAt}
                  onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  className="a-field"
                />
              </div>
              <div>
                <label className="a-label">Max uses (optional, blank = unlimited)</label>
                <input
                  type="number"
                  value={form.maxUses}
                  onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  className="a-field"
                  placeholder="e.g. 50"
                  min="1"
                  step="1"
                />
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="active-toggle"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-[var(--accent)] rounded"
                />
                <label htmlFor="active-toggle" className="text-sm text-white/70 cursor-pointer">
                  Active (code can be redeemed)
                </label>
              </div>
              {formError && <p className="text-red-400 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={formLoading} className="a-btn flex-1 !py-2.5">
                  {formLoading ? "Saving…" : editingId ? "Save changes" : "Create code"}
                </button>
                <button type="button" onClick={() => setModalOpen(false)} className="a-btn-ghost !py-2.5">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="a-scrim">
          <div className="a-modal max-w-sm">
            <h2 className="text-white text-lg font-semibold mb-2">Delete code?</h2>
            <p className="text-white/50 text-sm mb-6">
              Delete code{" "}
              <span className="text-white font-medium" style={{ fontFamily: "var(--font-geist-mono)" }}>
                {deleteTarget.code}
              </span>
              ? This cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleteLoading ? "Deleting…" : "Delete"}
              </button>
              <button onClick={() => setDeleteTarget(null)} className="a-btn-ghost !py-2.5">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
