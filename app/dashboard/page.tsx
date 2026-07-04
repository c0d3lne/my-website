"use client";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

type Photo = { id: string; path: string; kind: string };
type Booking = {
  id: string;
  services: string[];
  date: string | null;
  time: string | null;
  status: string;
  deposit: number;
  depositPaid: boolean;
  cancellation: { cancellable: boolean; depositRefundable: boolean; reason: string };
  photos: { before: Photo[]; after: Photo[] };
};
type Invoice = {
  id: string;
  number: string;
  amount: number;
  status: string;
  issuedDate: string;
  dueDate: string | null;
  bookingId: string | null;
  description: string | null;
};
type Me = {
  customer: { email: string; name: string | null; phone: string | null; address: string | null; referralCode: string };
  referral: { successful: number; pending: number; threshold: number; rewardEligible: boolean; rewardLabel: string };
  invoices: Invoice[];
  bookings: Booking[];
  stripeEnabled: boolean;
};

const fmt = (n: number) => `£${n.toFixed(2)}`;
const invPill: Record<string, string> = { paid: "a-pill-green", unpaid: "a-pill-amber", overdue: "a-pill-red" };
const bkPill: Record<string, string> = { pending: "a-pill-amber", confirmed: "a-pill-blue", completed: "a-pill-green", cancelled: "a-pill-red" };
function dfmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function DashboardInner() {
  const search = useSearchParams();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch("/api/account/me");
    setMe(res.ok ? await res.json() : null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const paid = search.get("paid");

  return (
    <main className="relative min-h-screen text-white" style={{ background: "var(--bg)" }}>
      <header className="border-b border-white/[0.07] sticky top-0 z-30 backdrop-blur" style={{ background: "rgba(5,4,21,0.85)" }}>
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold" style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-geist-mono)" }}>GB</div>
            <span className="font-semibold text-[15px]">GB <span className="text-blue-400">Detailing</span></span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/#quote" className="a-btn-ghost !py-1.5 !px-3 !text-xs">Book</Link>
            {me && (
              <button
                onClick={async () => { await fetch("/api/account/logout", { method: "POST" }); load(); }}
                className="a-btn-ghost !py-1.5 !px-3 !text-xs"
              >Sign out</button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-10">
        {loading ? (
          <div className="text-white/40 text-sm py-20 text-center">Loading…</div>
        ) : !me ? (
          <AuthCard onDone={load} />
        ) : (
          <>
            {paid && (
              <div className="a-card rounded-2xl p-4 mb-6" style={{ borderColor: "rgba(52,211,153,0.4)", background: "rgba(52,211,153,0.07)" }}>
                <p className="text-emerald-300 text-sm">✓ Payment received for {paid}. Thank you!</p>
              </div>
            )}
            <Dashboard me={me} onChange={load} />
          </>
        )}
      </div>
    </main>
  );
}

function Dashboard({ me, onChange }: { me: Me; onChange: () => void }) {
  const { customer, referral, invoices, bookings } = me;
  const pct = Math.min(100, (referral.successful / referral.threshold) * 100);
  const [copied, setCopied] = useState(false);
  const [paying, setPaying] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState("");

  async function confirmCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    setCancelError("");
    try {
      const res = await fetch(`/api/account/bookings/${cancelTarget.id}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCancelError(data.error ?? "Could not cancel — please contact us.");
        return;
      }
      setCancelTarget(null);
      onChange();
    } catch {
      setCancelError("Network error — try again.");
    } finally {
      setCancelling(false);
    }
  }

  async function payInvoice(id: string) {
    setPaying(id);
    const res = await fetch(`/api/invoices/${id}/pay`, { method: "POST" });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.url) window.location.href = data.url;
    else setPaying(null);
  }

  function copyCode() {
    navigator.clipboard?.writeText(customer.referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  const bookingsWithPhotos = bookings.filter((b) => b.photos.before.length + b.photos.after.length > 0);

  return (
    <>
      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
        Welcome{customer.name ? `, ${customer.name.split(" ")[0]}` : ""}.
      </h1>
      <p className="text-white/40 text-sm mt-1 mb-8">{customer.email}</p>

      {/* Referral */}
      <section
        className="hairline relative overflow-hidden rounded-2xl p-7 mb-8"
        style={{ background: "linear-gradient(160deg, rgba(77,142,255,0.08) 0%, rgba(8,7,28,0.6) 60%)" }}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-blue-300/80">Referral programme</p>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Your code</p>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold" style={{ fontFamily: "var(--font-geist-mono)" }}>{customer.referralCode}</span>
              <button onClick={copyCode} className="a-btn-ghost !py-1 !px-2.5 !text-xs">{copied ? "Copied" : "Copy"}</button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-black">{referral.successful} / {referral.threshold}</p>
            <p className="text-white/50 text-xs uppercase tracking-wider">Referrals</p>
          </div>
        </div>
        <div className="mt-5 h-2.5 rounded-full bg-white/[0.08] overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        {referral.rewardEligible ? (
          <div className="mt-4 flex items-center gap-2">
            <span className="a-pill a-pill-green">Reward unlocked</span>
            <span className="text-emerald-200 text-sm">You&apos;ve earned {referral.rewardLabel.toLowerCase()}! We&apos;ll be in touch.</span>
          </div>
        ) : (
          <p className="mt-4 text-white/50 text-sm">
            {referral.threshold - referral.successful} more completed referral{referral.threshold - referral.successful === 1 ? "" : "s"} to unlock: <span className="text-white/80">{referral.rewardLabel}</span>.
            {referral.pending > 0 && <span className="text-white/40"> ({referral.pending} pending)</span>}
          </p>
        )}
        <p className="mt-4 text-white/35 text-xs leading-relaxed">
          Share your code. When a new customer enters it in the Promo Code box while booking and the job is completed, it counts towards your reward. Cancelled bookings don&apos;t count.
        </p>
      </section>

      {/* Bookings */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Your bookings</h2>
        {bookings.length === 0 ? (
          <p className="text-white/30 text-sm">No bookings yet. <a href="/#quote" className="text-blue-300 hover:underline">Book a detail →</a></p>
        ) : (
          <div className="space-y-3">
            {bookings.map((b) => (
              <div key={b.id} className="a-card rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`a-pill ${bkPill[b.status] ?? "a-pill-slate"}`}>{b.status}</span>
                    <p className="text-white text-sm font-medium">{b.services.join(", ") || "Detailing"}</p>
                  </div>
                  <p className="text-white/40 text-xs mt-1.5">
                    {b.date ? dfmt(b.date) : "Date to confirm"}{b.time ? ` · ${b.time}` : ""}
                    {b.deposit > 0 && (
                      <>
                        {" · "}
                        <span className={b.depositPaid ? "text-emerald-300" : "text-amber-300"}>
                          Deposit {fmt(b.deposit)} {b.depositPaid ? "paid" : "due"}
                        </span>
                        <span className="text-white/30"> (non-refundable)</span>
                      </>
                    )}
                  </p>
                </div>
                <div className="shrink-0">
                  {b.status === "cancelled" || b.status === "completed" ? null : b.cancellation.cancellable ? (
                    <button onClick={() => { setCancelError(""); setCancelTarget(b); }} className="a-btn-danger">Cancel</button>
                  ) : (
                    <span className="text-white/30 text-xs max-w-[180px] block text-right">{b.cancellation.reason}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Invoices */}
      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-1">Invoices</h2>
        <p className="text-white/35 text-xs mb-3">Issued by GB Detailing. You can download or pay them here — they can only be changed by us.</p>
        {invoices.length === 0 ? (
          <p className="text-white/30 text-sm">No invoices yet.</p>
        ) : (
          <div className="a-card rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead><tr className="border-b border-white/[0.07]">
                {["Invoice", "Amount", "Status", "Issued", "Due", ""].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-white/30 font-medium text-xs uppercase tracking-wider">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b border-white/[0.04] last:border-0">
                    <td className="px-5 py-3">
                      <div className="text-white font-mono" style={{ fontFamily: "var(--font-geist-mono)" }}>{inv.number}</div>
                      {inv.description && <div className="text-white/40 text-xs">{inv.description}</div>}
                    </td>
                    <td className="px-5 py-3 text-white/80">{fmt(inv.amount)}</td>
                    <td className="px-5 py-3"><span className={`a-pill ${invPill[inv.status]}`}>{inv.status}</span></td>
                    <td className="px-5 py-3 text-white/50">{dfmt(inv.issuedDate)}</td>
                    <td className="px-5 py-3 text-white/50">{dfmt(inv.dueDate)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5 justify-end">
                        <a href={`/invoices/${inv.id}`} target="_blank" rel="noreferrer" className="a-btn-ghost !py-1 !px-2.5 !text-xs">PDF</a>
                        {inv.status !== "paid" && me.stripeEnabled && (
                          <button onClick={() => payInvoice(inv.id)} disabled={paying === inv.id} className="a-btn !py-1 !px-2.5 !text-xs">
                            {paying === inv.id ? "…" : "Pay"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Before & After */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Before &amp; after</h2>
        {bookingsWithPhotos.length === 0 ? (
          <p className="text-white/30 text-sm">Your before &amp; after photos will appear here once we&apos;ve completed a job.</p>
        ) : (
          <div className="space-y-5">
            {bookingsWithPhotos.map((b) => (
              <div key={b.id} className="a-card rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                  <p className="text-white text-sm font-medium">{b.services.join(", ") || "Detailing"}</p>
                  <p className="text-white/40 text-xs">{b.date ? dfmt(b.date) : ""}</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <PhotoGroup title="Before" photos={b.photos.before} />
                  <PhotoGroup title="After" photos={b.photos.after} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Cancel confirmation */}
      {cancelTarget && (
        <div className="a-scrim" onClick={(e) => { if (e.target === e.currentTarget && !cancelling) setCancelTarget(null); }}>
          <div className="a-modal max-w-sm">
            <h2 className="text-white text-lg font-semibold mb-2">Cancel this booking?</h2>
            <p className="text-white/60 text-sm mb-3">
              {cancelTarget.services.join(", ") || "Detailing"}
              {cancelTarget.date ? ` · ${dfmt(cancelTarget.date)}${cancelTarget.time ? ` · ${cancelTarget.time}` : ""}` : ""}
            </p>
            <div className={`rounded-xl border p-3 mb-5 ${cancelTarget.cancellation.depositRefundable ? "border-emerald-400/25 bg-emerald-500/[0.06]" : "border-amber-400/25 bg-amber-500/[0.06]"}`}>
              <p className={`text-xs leading-relaxed ${cancelTarget.cancellation.depositRefundable ? "text-emerald-200" : "text-amber-200"}`}>
                {cancelTarget.cancellation.depositRefundable ? (
                  <>Your 10% deposit{cancelTarget.deposit > 0 ? ` (${fmt(cancelTarget.deposit)})` : ""} will be <strong>refunded</strong> as you&apos;re cancelling with more than 48 hours&apos; notice.</>
                ) : (
                  <>Your 10% deposit{cancelTarget.deposit > 0 ? ` (${fmt(cancelTarget.deposit)})` : ""} is <strong>non-refundable</strong> (under 48 hours&apos; notice).</>
                )}{" "}This can&apos;t be undone.
              </p>
            </div>
            {cancelError && <p className="text-red-400 text-sm mb-3">{cancelError}</p>}
            <div className="flex gap-3">
              <button onClick={confirmCancel} disabled={cancelling} className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60">
                {cancelling ? "Cancelling…" : "Yes, cancel booking"}
              </button>
              <button onClick={() => setCancelTarget(null)} disabled={cancelling} className="a-btn-ghost !py-2.5">Keep it</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function PhotoGroup({ title, photos }: { title: string; photos: Photo[] }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/40 mb-2">{title}</p>
      {photos.length === 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] h-24 grid place-items-center text-white/25 text-xs">No {title.toLowerCase()} photos</div>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <a key={p.id} href={p.path} target="_blank" rel="noreferrer" className="block aspect-square rounded-lg overflow-hidden border border-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.path} alt={title} className="h-full w-full object-cover hover:scale-105 transition-transform" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

function AuthCard({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const url = mode === "login" ? "/api/account/login" : "/api/account/register";
    const body = mode === "login"
      ? { email, password }
      : { email, password, name: name || undefined, phone: phone || undefined, address: address || undefined };
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error ?? "Something went wrong"); return; }
      onDone();
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-black tracking-tight">Customer dashboard</h1>
        <p className="text-white/40 text-sm mt-1">Track your referrals, invoices and before &amp; after photos.</p>
      </div>

      <div className="a-card rounded-2xl p-7">
        <div className="flex gap-1 mb-6 p-1 rounded-full bg-white/[0.04] border border-white/[0.06]">
          {(["login", "register"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(""); }}
              className={`flex-1 rounded-full py-2 text-sm font-medium transition-colors ${mode === m ? "bg-[var(--accent)] text-white" : "text-white/50 hover:text-white"}`}
            >
              {m === "login" ? "Sign in" : "Create account"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="a-label">Full name</label>
              <input className="a-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane Smith" />
            </div>
          )}
          <div>
            <label className="a-label">Email</label>
            <input type="email" required className="a-field" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="a-label">Password</label>
            <input type="password" required minLength={mode === "register" ? 8 : undefined} className="a-field" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={mode === "register" ? "At least 8 characters" : "Your password"} autoComplete={mode === "login" ? "current-password" : "new-password"} />
          </div>
          {mode === "register" && (
            <>
              <div>
                <label className="a-label">Phone (optional)</label>
                <input className="a-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07700 000000" />
              </div>
              <div>
                <label className="a-label">Address (optional)</label>
                <input className="a-field" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="12 High St, Warboys" />
              </div>
            </>
          )}
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" disabled={loading} className="a-btn w-full !py-3">
            {loading ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        <p className="text-white/35 text-xs text-center mt-5">
          {mode === "register"
            ? "Use the same email you book with so your invoices and photos link up automatically."
            : "New here? Create an account to get your referral code."}
        </p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="text-white/40 text-sm py-20 text-center" style={{ background: "var(--bg)" }}>Loading…</div>}>
      <DashboardInner />
    </Suspense>
  );
}
