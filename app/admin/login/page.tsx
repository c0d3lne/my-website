"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
      } else {
        setError("Incorrect password.");
      }
    } catch {
      setError("Network error — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8 border border-white/[0.07] bg-white/[0.025] backdrop-blur"
        style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.6)" }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold"
            style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-geist-mono)" }}
          >
            GB
          </div>
          <span className="text-white/70 text-sm tracking-wider uppercase font-medium">
            Admin
          </span>
        </div>

        <h1 className="text-white text-2xl font-semibold mb-1">Sign in</h1>
        <p className="text-white/40 text-sm mb-7">GB Detailing dashboard</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-white/50 text-xs font-medium mb-2 uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg px-4 py-3 text-white text-sm bg-white/[0.06] border border-white/[0.09] focus:outline-none focus:border-[var(--accent)] transition-colors"
              placeholder="Enter admin password"
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            style={{ background: "var(--accent)" }}
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
