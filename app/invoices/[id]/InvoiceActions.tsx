"use client";
import { useState } from "react";

export default function InvoiceActions({
  invoiceId,
  payable,
  stripeEnabled,
}: {
  invoiceId: string;
  payable: boolean;
  stripeEnabled: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function pay() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, { method: "POST" });
      const data = await res.json();
      if (res.ok && data.url) {
        window.location.href = data.url;
      } else {
        setError(data.error ?? "Could not start payment.");
        setLoading(false);
      }
    } catch {
      setError("Network error — try again.");
      setLoading(false);
    }
  }

  return (
    <div className="no-print mt-8 flex flex-wrap gap-3">
      <button onClick={() => window.print()} className="a-btn-ghost">Download / Print PDF</button>
      {payable && stripeEnabled && (
        <button onClick={pay} disabled={loading} className="a-btn">
          {loading ? "Redirecting…" : "Pay now"}
        </button>
      )}
      {error && <p className="w-full text-red-400 text-sm">{error}</p>}
    </div>
  );
}
