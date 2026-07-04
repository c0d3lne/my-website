"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";

type Area = { id: string; name: string; postcodePrefix: string | null; charge: number };
type Settings = { default_travel_charge: number; referral_threshold: number; reward_label: string };

export default function AdminTravel() {
  const router = useRouter();
  const [areas, setAreas] = useState<Area[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  // new-area form
  const [name, setName] = useState("");
  const [prefix, setPrefix] = useState("");
  const [charge, setCharge] = useState("");
  const [addErr, setAddErr] = useState("");

  // settings form (local, saved on blur/submit)
  const [defCharge, setDefCharge] = useState("");
  const [threshold, setThreshold] = useState("");
  const [reward, setReward] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/travel");
    if (res.status === 401) { router.push("/admin/login"); return; }
    const data = await res.json();
    setAreas(data.areas);
    setSettings(data.settings);
    setDefCharge(String(data.settings.default_travel_charge));
    setThreshold(String(data.settings.referral_threshold));
    setReward(data.settings.reward_label);
    setLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  async function addArea(e: React.FormEvent) {
    e.preventDefault();
    setAddErr("");
    const res = await fetch("/api/admin/travel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, postcodePrefix: prefix || undefined, charge: parseFloat(charge) || 0 }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setAddErr(d.error ?? "Could not add"); return; }
    setName(""); setPrefix(""); setCharge("");
    load();
  }

  async function updateArea(id: string, patch: Partial<{ name: string; postcodePrefix: string | null; charge: number }>) {
    await fetch(`/api/admin/travel/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    load();
  }

  async function deleteArea(id: string) {
    await fetch(`/api/admin/travel/${id}`, { method: "DELETE" });
    load();
  }

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        default_travel_charge: parseFloat(defCharge) || 0,
        referral_threshold: parseInt(threshold, 10) || 5,
        reward_label: reward,
      }),
    });
    setSavedMsg("Saved");
    setTimeout(() => setSavedMsg(""), 1500);
    load();
  }

  if (loading || !settings) return <div className="text-white/40 text-sm py-20 text-center">Loading…</div>;

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <h2 className="text-white text-xl font-semibold">Travel &amp; settings</h2>
      <p className="text-white/40 text-sm mt-0.5 mb-6">
        Set included areas and travel charges. Anywhere not listed uses the default charge. Charges show on the booking form before payment.
      </p>

      {/* Areas */}
      <div className="a-card rounded-2xl p-6">
        <h3 className="text-white font-semibold mb-4">Service areas</h3>
        <div className="space-y-2">
          {areas.map((a) => (
            <div key={a.id} className="flex items-center gap-3 flex-wrap rounded-xl border border-white/[0.07] bg-white/[0.02] p-3">
              <input
                defaultValue={a.name}
                onBlur={(e) => e.target.value !== a.name && updateArea(a.id, { name: e.target.value })}
                className="a-field !w-40"
              />
              <input
                defaultValue={a.postcodePrefix ?? ""}
                placeholder="Postcode (e.g. PE28)"
                onBlur={(e) => (e.target.value.toUpperCase() !== (a.postcodePrefix ?? "")) && updateArea(a.id, { postcodePrefix: e.target.value || null })}
                className="a-field !w-40"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              />
              <div className="flex items-center gap-2">
                <span className="text-white/40 text-sm">£</span>
                <input
                  type="number" min="0" step="0.5"
                  defaultValue={a.charge}
                  onBlur={(e) => parseFloat(e.target.value) !== a.charge && updateArea(a.id, { charge: parseFloat(e.target.value) || 0 })}
                  className="a-field !w-24"
                />
                <span className="text-white/40 text-xs w-16">{a.charge === 0 ? "included" : "charge"}</span>
              </div>
              <button onClick={() => deleteArea(a.id)} className="a-btn-danger ml-auto">Remove</button>
            </div>
          ))}
          {areas.length === 0 && <p className="text-white/30 text-sm">No areas yet. The default charge applies everywhere.</p>}
        </div>

        <form onSubmit={addArea} className="mt-5 pt-5 border-t border-white/[0.07] flex items-end gap-3 flex-wrap">
          <div>
            <label className="a-label">Area name</label>
            <input required value={name} onChange={(e) => setName(e.target.value)} className="a-field !w-40" placeholder="e.g. St Ives" />
          </div>
          <div>
            <label className="a-label">Postcode prefix</label>
            <input value={prefix} onChange={(e) => setPrefix(e.target.value)} className="a-field !w-40" placeholder="PE27" style={{ fontFamily: "var(--font-geist-mono)" }} />
          </div>
          <div>
            <label className="a-label">Charge (£)</label>
            <input type="number" min="0" step="0.5" value={charge} onChange={(e) => setCharge(e.target.value)} className="a-field !w-28" placeholder="0 = free" />
          </div>
          <button type="submit" className="a-btn">Add area</button>
          {addErr && <p className="text-red-400 text-sm w-full">{addErr}</p>}
        </form>
      </div>

      {/* Settings */}
      <form onSubmit={saveSettings} className="a-card rounded-2xl p-6 mt-6">
        <h3 className="text-white font-semibold mb-4">Rules</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="a-label">Default travel charge (£)</label>
            <input type="number" min="0" step="0.5" value={defCharge} onChange={(e) => setDefCharge(e.target.value)} className="a-field" />
            <p className="text-white/30 text-xs mt-1">Applied to areas not listed above.</p>
          </div>
          <div>
            <label className="a-label">Referrals for reward</label>
            <input type="number" min="1" step="1" value={threshold} onChange={(e) => setThreshold(e.target.value)} className="a-field" />
          </div>
          <div>
            <label className="a-label">Reward description</label>
            <input value={reward} onChange={(e) => setReward(e.target.value)} className="a-field" />
          </div>
        </div>
        <div className="mt-5 flex items-center gap-3">
          <button type="submit" className="a-btn">Save rules</button>
          {savedMsg && <span className="text-emerald-300 text-sm">{savedMsg}</span>}
        </div>
      </form>
    </main>
  );
}
