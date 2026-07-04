"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import PhotoManager from "../../_components/PhotoManager";

type Photo = { id: string; path: string; kind: string };
type Booking = {
  id: string;
  services: string[];
  date: string | null;
  time: string | null;
  status: string;
  subtotal: number;
  deposit: number;
  depositPaid: boolean;
  promoCode: string | null;
  photos: { before: Photo[]; after: Photo[] };
};
type Invoice = { id: string; number: string; amount: number; status: string; issuedDate: string; dueDate: string | null };
type Profile = {
  customer: { id: string; email: string; name: string | null; phone: string | null; address: string | null; referralCode: string; createdAt: string };
  referral: { successful: number; pending: number; threshold: number; rewardEligible: boolean; rewardLabel: string };
  invoices: Invoice[];
  bookings: Booking[];
};

const fmt = (n: number) => `£${n.toFixed(2)}`;
const pill: Record<string, string> = {
  pending: "a-pill-amber", confirmed: "a-pill-blue", completed: "a-pill-green", cancelled: "a-pill-red",
  paid: "a-pill-green", unpaid: "a-pill-amber", overdue: "a-pill-red",
};
function dfmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export default function CustomerProfile() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/customers/${params.id}`);
    if (res.status === 401) { router.push("/admin/login"); return; }
    if (res.status === 404) { setNotFound(true); setLoading(false); return; }
    setData(await res.json());
    setLoading(false);
  }, [params.id, router]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-white/40 text-sm py-20 text-center">Loading…</div>;
  if (notFound || !data) return <div className="text-white/30 text-center py-20">Customer not found.</div>;

  const { customer, referral, invoices, bookings } = data;
  const progressPct = Math.min(100, (referral.successful / referral.threshold) * 100);

  return (
    <main className="max-w-5xl mx-auto px-6 py-8">
      <Link href="/admin/customers" className="text-blue-300 text-sm hover:underline">← All customers</Link>

      <div className="flex items-start justify-between gap-4 mt-4 mb-6 flex-wrap">
        <div>
          <h2 className="text-white text-2xl font-semibold">{customer.name ?? customer.email}</h2>
          <p className="text-white/40 text-sm mt-1">Customer since {dfmt(customer.createdAt.slice(0, 10))}</p>
        </div>
        {referral.rewardEligible && <span className="a-pill a-pill-green">Free wash earned</span>}
      </div>

      {/* Contact + referral */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="a-card rounded-2xl p-6">
          <h3 className="a-label">Contact</h3>
          <div className="space-y-3 mt-3 text-sm">
            <Row label="Email"><a href={`mailto:${customer.email}`} className="text-blue-300 hover:underline">{customer.email}</a></Row>
            <Row label="Phone">{customer.phone ? <a href={`tel:${customer.phone}`} className="text-white/80">{customer.phone}</a> : <span className="text-white/40">—</span>}</Row>
            <Row label="Address"><span className="text-white/80">{customer.address ?? "—"}</span></Row>
          </div>
          <a href={`mailto:${customer.email}`} className="a-btn !py-2 !text-xs mt-4">Email customer</a>
        </div>

        <div className="a-card rounded-2xl p-6">
          <h3 className="a-label">Referrals</h3>
          <div className="flex items-center justify-between mt-3">
            <span className="text-white/70 text-sm" style={{ fontFamily: "var(--font-geist-mono)" }}>{customer.referralCode}</span>
            <span className="text-white/80 text-sm">{referral.successful} / {referral.threshold}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-300" style={{ width: `${progressPct}%` }} />
          </div>
          <p className="text-white/40 text-xs mt-3">
            {referral.pending} pending · Reward at {referral.threshold}: {referral.rewardLabel}
          </p>
        </div>
      </div>

      {/* Invoices */}
      <section className="mt-8">
        <h3 className="text-white font-semibold mb-3">Invoices</h3>
        {invoices.length === 0 ? (
          <p className="text-white/30 text-sm">No invoices yet.</p>
        ) : (
          <div className="a-card rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead><tr className="border-b border-white/[0.07]">
                {["Invoice", "Amount", "Status", "Issued", "Due", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3 text-white font-mono" style={{ fontFamily: "var(--font-geist-mono)" }}>{inv.number}</td>
                    <td className="px-5 py-3 text-white/80">{fmt(inv.amount)}</td>
                    <td className="px-5 py-3"><span className={`a-pill ${pill[inv.status]}`}>{inv.status}</span></td>
                    <td className="px-5 py-3 text-white/50">{dfmt(inv.issuedDate)}</td>
                    <td className="px-5 py-3 text-white/50">{dfmt(inv.dueDate)}</td>
                    <td className="px-5 py-3 text-right"><a href={`/invoices/${inv.id}`} target="_blank" rel="noreferrer" className="a-btn-ghost !py-1 !px-2.5 !text-xs">View</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Bookings + photos */}
      <section className="mt-8">
        <h3 className="text-white font-semibold mb-3">Booking history</h3>
        {bookings.length === 0 ? (
          <p className="text-white/30 text-sm">No bookings yet.</p>
        ) : (
          <div className="space-y-4">
            {bookings.map((b) => (
              <div key={b.id} className="a-card rounded-2xl p-5">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-white text-sm font-medium">{b.services.join(", ") || "Booking"}</p>
                    <p className="text-white/40 text-xs mt-0.5">
                      {b.date ? dfmt(b.date) : "No date"}{b.time ? ` · ${b.time}` : ""} · {fmt(b.subtotal)}
                      {b.deposit > 0 ? ` · deposit ${fmt(b.deposit)} ${b.depositPaid ? "paid" : "due"}` : ""}
                      {b.promoCode ? ` · code ${b.promoCode}` : ""}
                    </p>
                  </div>
                  <span className={`a-pill ${pill[b.status]}`}>{b.status}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/[0.06]">
                  <PhotoManager bookingId={b.id} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-white/40 text-xs uppercase tracking-wider">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
