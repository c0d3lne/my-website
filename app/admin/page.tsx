"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Overview = {
  bookingCounts: Record<string, number>;
  totalBookings: number;
  invoices: { total: number; unpaid: number; overdue: number; outstanding: number };
  customers: number;
  rewardEligible: Array<{
    email: string;
    name: string | null;
    referralCode: string | null;
    successful: number;
  }>;
};

const fmt = (n: number) => `£${n.toFixed(2)}`;

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/overview");
        if (res.status === 401) { router.push("/admin/login"); return; }
        setData(await res.json());
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h2 className="text-white text-xl font-semibold mb-1">Dashboard</h2>
      <p className="text-white/40 text-sm mb-6">Overview of bookings, invoices and customers.</p>

      {loading || !data ? (
        <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
      ) : (
        <>
          {/* Reward notification */}
          {data.rewardEligible.length > 0 && (
            <div className="a-card rounded-2xl p-5 mb-6" style={{ borderColor: "rgba(52,211,153,0.35)", background: "rgba(52,211,153,0.06)" }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="a-pill a-pill-green">Reward earned</span>
                <span className="text-white/70 text-sm">
                  {data.rewardEligible.length} customer{data.rewardEligible.length > 1 ? "s have" : " has"} reached the referral goal
                </span>
              </div>
              <ul className="mt-3 space-y-2">
                {data.rewardEligible.map((c) => (
                  <li key={c.email} className="flex items-center justify-between text-sm">
                    <span className="text-white">
                      {c.name ?? c.email}{" "}
                      <span className="text-white/40" style={{ fontFamily: "var(--font-geist-mono)" }}>
                        {c.referralCode}
                      </span>
                    </span>
                    <span className="text-emerald-300">{c.successful} referrals · free wash</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total bookings" value={String(data.totalBookings)} href="/admin/bookings" />
            <StatCard label="Pending bookings" value={String(data.bookingCounts.pending ?? 0)} href="/admin/bookings" accent="amber" />
            <StatCard label="Unpaid invoices" value={String(data.invoices.unpaid)} sub={fmt(data.invoices.outstanding) + " outstanding"} href="/admin/invoices" accent={data.invoices.overdue > 0 ? "red" : "blue"} />
            <StatCard label="Customers" value={String(data.customers)} href="/admin/customers" />
          </div>

          {/* Booking status breakdown */}
          <div className="a-card rounded-2xl p-6 mt-6">
            <h3 className="text-white font-semibold mb-4">Bookings by status</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(["pending", "confirmed", "completed", "cancelled"] as const).map((s) => (
                <div key={s}>
                  <p className="text-2xl font-bold text-white">{data.bookingCounts[s] ?? 0}</p>
                  <p className="text-xs uppercase tracking-wider text-white/40 mt-1">{s}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 mt-6">
            <Link href="/admin/invoices" className="a-btn">Create invoice</Link>
            <Link href="/admin/calendar" className="a-btn-ghost">Manage calendar</Link>
            <Link href="/admin/travel" className="a-btn-ghost">Travel &amp; settings</Link>
          </div>
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  href,
  accent = "blue",
}: {
  label: string;
  value: string;
  sub?: string;
  href: string;
  accent?: "blue" | "amber" | "red";
}) {
  const ring =
    accent === "amber" ? "text-amber-300" : accent === "red" ? "text-red-300" : "text-blue-300";
  return (
    <Link href={href} className="a-card rounded-2xl p-5 hover:bg-white/[0.04] transition-colors block">
      <p className="text-xs uppercase tracking-wider text-white/40">{label}</p>
      <p className={`text-3xl font-bold mt-2 ${ring}`}>{value}</p>
      {sub && <p className="text-xs text-white/40 mt-1">{sub}</p>}
    </Link>
  );
}
