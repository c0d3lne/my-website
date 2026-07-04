"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CustomerRow = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  referralCode: string;
  createdAt: string;
  referral: { successful: number; threshold: number; rewardEligible: boolean };
};

export default function AdminCustomers() {
  const router = useRouter();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/customers");
    if (res.status === 401) { router.push("/admin/login"); return; }
    setCustomers(await res.json());
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const shown = customers.filter((c) => {
    const t = q.toLowerCase();
    return !t || c.email.toLowerCase().includes(t) || (c.name ?? "").toLowerCase().includes(t) || c.referralCode.toLowerCase().includes(t);
  });

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h2 className="text-white text-xl font-semibold">Customers</h2>
          <p className="text-white/40 text-sm mt-0.5">Registered accounts and their referral progress.</p>
        </div>
        <input
          className="a-field !w-64"
          placeholder="Search name, email or code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="text-center py-24 text-white/30">No customers{q ? " match your search" : " yet"}.</div>
      ) : (
        <div className="a-card rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[680px]">
            <thead>
              <tr className="border-b border-white/[0.07]">
                {["Name", "Email", "Phone", "Referral code", "Referrals", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-4 text-white/30 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {shown.map((c) => (
                <tr key={c.id} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-5 py-4 text-white">{c.name ?? "—"}</td>
                  <td className="px-5 py-4">
                    <a href={`mailto:${c.email}`} className="text-blue-300 hover:underline">{c.email}</a>
                  </td>
                  <td className="px-5 py-4 text-white/60">{c.phone ?? "—"}</td>
                  <td className="px-5 py-4 text-white/70" style={{ fontFamily: "var(--font-geist-mono)" }}>{c.referralCode}</td>
                  <td className="px-5 py-4">
                    <span className={`a-pill ${c.referral.rewardEligible ? "a-pill-green" : "a-pill-slate"}`}>
                      {c.referral.successful} / {c.referral.threshold}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <Link href={`/admin/customers/${c.id}`} className="a-btn-ghost !py-1.5 !px-3 !text-xs">View</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
