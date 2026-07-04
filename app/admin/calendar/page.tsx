"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

function isoOf(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function AdminCalendar() {
  const router = useRouter();
  const [blocked, setBlocked] = useState<Set<string>>(new Set());
  const [taken, setTaken] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [view, setView] = useState<{ y: number; m: number } | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/availability");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setBlocked(new Set(data.blockedDays));
    setTaken(data.taken ?? {});
    setLoading(false);
  }, [router]);

  useEffect(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0);
    setToday(d);
    setView({ y: d.getFullYear(), m: d.getMonth() });
    load();
  }, [load]);

  const grid = useMemo(() => {
    if (!view || !today) return [];
    const first = new Date(view.y, view.m, 1);
    const startWeekday = (first.getDay() + 6) % 7;
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const cells: Array<{ date: Date | null; iso: string; isPast: boolean }> = [];
    for (let i = 0; i < startWeekday; i++) cells.push({ date: null, iso: "", isPast: false });
    for (let d = 1; d <= days; d++) {
      const date = new Date(view.y, view.m, d);
      cells.push({ date, iso: isoOf(date), isPast: date < today });
    }
    while (cells.length % 7 !== 0) cells.push({ date: null, iso: "", isPast: false });
    return cells;
  }, [view, today]);

  const monthLabel = view ? new Date(view.y, view.m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" }) : "";

  async function toggle(iso: string) {
    const willBlock = !blocked.has(iso);
    setBusy(iso);
    // optimistic
    setBlocked((prev) => {
      const next = new Set(prev);
      if (willBlock) next.add(iso); else next.delete(iso);
      return next;
    });
    await fetch("/api/admin/availability", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: iso, blocked: willBlock }),
    });
    setBusy(null);
  }

  function shift(n: number) {
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.y, v.m + n, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-8">
      <h2 className="text-white text-xl font-semibold">Calendar</h2>
      <p className="text-white/40 text-sm mt-0.5 mb-6">
        Every day is bookable by default. Click a day to switch it off — customers can&apos;t book unavailable days. Booked slots are blocked automatically.
      </p>

      <div className="a-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-5">
          <button onClick={() => shift(-1)} className="a-btn-ghost !py-1.5 !px-3">←</button>
          <p className="text-white font-semibold">{monthLabel}</p>
          <button onClick={() => shift(1)} className="a-btn-ghost !py-1.5 !px-3">→</button>
        </div>

        {loading ? (
          <div className="text-white/40 text-sm py-16 text-center">Loading…</div>
        ) : (
          <>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 mb-1">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => <span key={d} className="py-1.5">{d}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {grid.map((c, i) => {
                if (!c.date) return <span key={i} className="aspect-square" />;
                const isBlocked = blocked.has(c.iso);
                const bookedCount = taken[c.iso]?.length ?? 0;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={c.isPast || busy === c.iso}
                    onClick={() => toggle(c.iso)}
                    title={c.isPast ? "Past" : isBlocked ? "Unavailable — click to enable" : "Available — click to disable"}
                    className={[
                      "relative aspect-square rounded-lg text-sm flex items-center justify-center transition-all border",
                      c.isPast ? "text-slate-700 border-transparent cursor-not-allowed" : "cursor-pointer",
                      !c.isPast && isBlocked ? "bg-red-500/15 border-red-400/30 text-red-200" : "",
                      !c.isPast && !isBlocked ? "bg-white/[0.03] border-white/10 text-white hover:border-white/25" : "",
                    ].join(" ")}
                  >
                    {c.date.getDate()}
                    {bookedCount > 0 && !isBlocked && (
                      <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-1 w-3 rounded-full bg-blue-400" title={`${bookedCount} booked`} />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-xs text-white/50">
              <Legend className="bg-white/[0.03] border border-white/10" label="Available" />
              <Legend className="bg-red-500/15 border border-red-400/30" label="Unavailable" />
              <Legend dot label="Has bookings" />
            </div>
          </>
        )}
      </div>
    </main>
  );
}

function Legend({ className, label, dot }: { className?: string; label: string; dot?: boolean }) {
  return (
    <span className="flex items-center gap-2">
      {dot ? (
        <span className="relative h-4 w-4 rounded bg-white/[0.03] border border-white/10">
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-1 w-2 rounded-full bg-blue-400" />
        </span>
      ) : (
        <span className={`h-4 w-4 rounded ${className}`} />
      )}
      {label}
    </span>
  );
}
