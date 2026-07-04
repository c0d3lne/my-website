import { NextRequest, NextResponse } from "next/server";
import { getInvoiceById, attachStripeSession } from "@/lib/invoices";
import { getStripe, stripeConfigured, siteUrl } from "@/lib/stripe";

export const runtime = "nodejs";

// Creates a Stripe Checkout session for an unpaid invoice. Reachable by invoice
// id (an unguessable capability we email to the customer), so it works both
// from the dashboard and from an emailed invoice link — no login required.
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Online payment is not enabled." }, { status: 400 });
  }

  const invoice = getInvoiceById(id);
  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (invoice.status === "paid") {
    return NextResponse.json({ error: "Invoice already paid" }, { status: 409 });
  }

  const stripe = getStripe()!;
  const checkout = await stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: invoice.customerEmail,
    line_items: [
      {
        price_data: {
          currency: "gbp",
          product_data: {
            name: `Invoice ${invoice.number}`,
            description: invoice.description ?? "GB Detailing service",
          },
          unit_amount: Math.round(invoice.amount * 100),
        },
        quantity: 1,
      },
    ],
    metadata: { invoiceId: invoice.id },
    success_url: `${siteUrl()}/invoices/${invoice.id}?paid=1`,
    cancel_url: `${siteUrl()}/invoices/${invoice.id}?canceled=1`,
  });

  attachStripeSession(invoice.id, checkout.id);
  return NextResponse.json({ url: checkout.url });
}
