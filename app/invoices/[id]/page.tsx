import { notFound } from "next/navigation";
import Link from "next/link";
import { getInvoiceById } from "@/lib/invoices";
import { stripeConfigured } from "@/lib/stripe";
import InvoiceActions from "./InvoiceActions";

const fmt = (n: number) => `£${n.toFixed(2)}`;
function dateFmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso + "T00:00:00").toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const statusPill: Record<string, string> = {
  paid: "a-pill-green",
  unpaid: "a-pill-amber",
  overdue: "a-pill-red",
};

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const invoice = getInvoiceById(id);
  if (!invoice) notFound();

  return (
    <main className="relative min-h-screen py-12 px-5" style={{ background: "var(--bg)" }}>
      <div className="mx-auto max-w-2xl">
        <div className="no-print mb-5">
          <Link href="/dashboard" className="text-blue-300 text-sm hover:underline">← Back to dashboard</Link>
        </div>

        <div className="a-card rounded-2xl p-8 sm:p-10 print-sheet">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center text-base font-bold"
                style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-geist-mono)" }}
              >
                GB
              </div>
              <div>
                <p className="text-white font-semibold text-lg leading-tight">GB Detailing</p>
                <p className="text-white/40 text-xs">Cambridge, UK · +44 07594 780 797</p>
              </div>
            </div>
            <span className={`a-pill ${statusPill[invoice.status]}`}>{invoice.status}</span>
          </div>

          <div className="mt-8 flex flex-wrap justify-between gap-6">
            <div>
              <p className="a-label">Billed to</p>
              <p className="text-white">{invoice.customerName ?? invoice.customerEmail}</p>
              <p className="text-white/50 text-sm">{invoice.customerEmail}</p>
            </div>
            <div className="text-right">
              <p className="a-label">Invoice</p>
              <p className="text-white font-mono" style={{ fontFamily: "var(--font-geist-mono)" }}>{invoice.number}</p>
              <p className="text-white/50 text-sm mt-2">Issued {dateFmt(invoice.issuedDate)}</p>
              {invoice.dueDate && <p className="text-white/50 text-sm">Due {dateFmt(invoice.dueDate)}</p>}
            </div>
          </div>

          <div className="mt-8 rounded-xl overflow-hidden border border-white/[0.08]">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                  <th className="text-left px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Description</th>
                  <th className="text-right px-5 py-3 text-white/40 font-medium text-xs uppercase tracking-wider">Amount</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-5 py-4 text-white/80">{invoice.description ?? "GB Detailing service"}</td>
                  <td className="px-5 py-4 text-right text-white/80">{fmt(invoice.amount)}</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t border-white/[0.08]">
                  <td className="px-5 py-4 text-white font-semibold text-right">Total</td>
                  <td className="px-5 py-4 text-right text-white font-bold text-lg">{fmt(invoice.amount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {invoice.status === "paid" && invoice.paidAt && (
            <p className="mt-5 text-emerald-300 text-sm">
              ✓ Paid on {new Date(invoice.paidAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </p>
          )}

          <p className="mt-8 text-white/35 text-xs leading-relaxed">
            Thank you for choosing GB Detailing. For questions about this invoice, contact us on +44 07594 780 797.
          </p>
        </div>

        <InvoiceActions
          invoiceId={invoice.id}
          payable={invoice.status !== "paid"}
          stripeEnabled={stripeConfigured()}
        />
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-sheet { border: none !important; background: #fff !important; color: #000 !important; }
        }
      `}</style>
    </main>
  );
}
