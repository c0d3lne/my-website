"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import PhotoManager from "../_components/PhotoManager";

type Booking = {
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
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
};

const STATUSES = ["pending", "confirmed", "completed", "cancelled"] as const;
const fmt = (n: number) => `£${n.toFixed(2)}`;
const pillClass: Record<string, string> = {
  pending: "a-pill-amber",
  confirmed: "a-pill-blue",
  completed: "a-pill-green",
  cancelled: "a-pill-red",
};

function dateLabel(date: string | null, time: string | null) {
  if (!date) return "—";
  const d = new Date(date + "T00:00:00").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  return time ? `${d} · ${time}` : d;
}

export default function AdminBookings() {
  const router = useRouter();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<Booking | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/bookings");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setBookings(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function setStatus(b: Booking, status: Booking["status"]) {
    await fetch(`/api/admin/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    load();
    setDetail((d) => (d && d.id === b.id ? { ...d, status } : d));
  }

  async function setDepositPaid(b: Booking, depositPaid: boolean) {
    await fetch(`/api/admin/bookings/${b.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ depositPaid }),
    });
    load();
    setDetail((d) => (d && d.id === b.id ? { ...d, depositPaid } : d));
  }

  const shown = filter === "all" ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-semibold">Bookings</h2>
          <p className="text-white/40 text-sm mt-0.5">Every booking placed from the website.</p>
        </div>
        <div className="flex gap-1 flex-wrap">
          {["all", ...STATUSES].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                filter === s ? "bg-white/[0.08] text-white" : "text-white/40 hover:text-white"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="text-center py-24 text-white/30">No bookings{filter !== "all" ? ` with status “${filter}”` : ""} yet.</div>
      ) : (
        <div className="a-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["When", "Customer", "Services", "Total", "Status", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-white/30 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((b) => (
                <tr key={b.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-white/80 whitespace-nowrap">{dateLabel(b.date, b.time)}</td>
                  <td className="px-5 py-4">
                    <div className="text-white">{b.name ?? "—"}</div>
                    <div className="text-white/40 text-xs">{b.customerEmail}</div>
                  </td>
                  <td className="px-5 py-4 text-white/60 max-w-[220px] truncate">{b.services.join(", ") || "—"}</td>
                  <td className="px-5 py-4 text-white/80">{fmt(b.subtotal)}</td>
                  <td className="px-5 py-4">
                    <span className={`a-pill ${pillClass[b.status]}`}>{b.status}</span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button onClick={() => setDetail(b)} className="a-btn-ghost !py-1.5 !px-3 !text-xs">Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {detail && (
        <div className="a-scrim" onClick={(e) => { if (e.target === e.currentTarget) setDetail(null); }}>
          <div className="a-modal max-w-2xl">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-white text-lg font-semibold">{detail.name ?? detail.customerEmail}</h2>
                <p className="text-white/40 text-sm">{dateLabel(detail.date, detail.time)}</p>
              </div>
              <span className={`a-pill ${pillClass[detail.status]}`}>{detail.status}</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-sm">
              <Info label="Email" value={detail.customerEmail} />
              <Info label="Phone" value={detail.phone ?? "—"} />
              <Info label="Address" value={detail.address ?? "—"} />
              <Info label="Travel" value={detail.travelArea ? `${detail.travelArea} · ${fmt(detail.travelCharge)}` : "—"} />
              <Info label="Promo code" value={detail.promoCode ?? "—"} mono />
              <div>
                <span className="a-label">Deposit (10%)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white/80">{fmt(detail.deposit)}</span>
                  <span className={`a-pill ${detail.depositPaid ? "a-pill-green" : "a-pill-amber"}`}>
                    {detail.depositPaid ? "Paid" : "Due"}
                  </span>
                  <button
                    onClick={() => setDepositPaid(detail, !detail.depositPaid)}
                    className="a-btn-ghost !py-1 !px-2.5 !text-xs"
                  >
                    {detail.depositPaid ? "Mark unpaid" : "Mark paid"}
                  </button>
                </div>
                <p className="text-white/30 text-[11px] mt-1">Non-refundable on cancellation.</p>
              </div>
            </div>
            {detail.services.length > 0 && (
              <div className="mt-4">
                <span className="a-label">Services</span>
                <p className="text-white/80 text-sm">{detail.services.join(", ")}</p>
              </div>
            )}
            {detail.notes && (
              <div className="mt-4">
                <span className="a-label">Notes</span>
                <p className="text-white/70 text-sm whitespace-pre-wrap">{detail.notes}</p>
              </div>
            )}

            <div className="mt-6">
              <span className="a-label">Status</span>
              <div className="flex gap-2 flex-wrap mt-1">
                {STATUSES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(detail, s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium uppercase tracking-wide transition-colors ${
                      detail.status === s ? "bg-[var(--accent)] text-white" : "border border-white/10 text-white/60 hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-xs mt-2">
                Marking a referred booking “completed” counts the referral. “Cancelled” removes it.
              </p>
            </div>

            <div className="mt-6 pt-5 border-t border-white/[0.07]">
              <span className="a-label">Before &amp; after photos</span>
              <p className="text-white/40 text-xs mb-3">Uploaded photos appear in the customer&apos;s dashboard automatically.</p>
              <PhotoManager bookingId={detail.id} />
            </div>

            <div className="mt-6 flex justify-between items-center">
              <Link
                href={`/admin/invoices?email=${encodeURIComponent(detail.customerEmail)}&bookingId=${detail.id}&name=${encodeURIComponent(detail.name ?? "")}&amount=${detail.subtotal}`}
                className="a-btn !py-2 !text-xs"
              >
                Create invoice for this booking
              </Link>
              <button onClick={() => setDetail(null)} className="a-btn-ghost !py-2">Close</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Info({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <span className="a-label">{label}</span>
      <p className={`text-white/80 ${mono ? "font-mono" : ""}`} style={mono ? { fontFamily: "var(--font-geist-mono)" } : undefined}>
        {value}
      </p>
    </div>
  );
}
