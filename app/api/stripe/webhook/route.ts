import { NextRequest, NextResponse } from "next/server";
import { getStripe, stripeConfigured } from "@/lib/stripe";
import { markInvoicePaid } from "@/lib/invoices";

export const runtime = "nodejs";

// Stripe posts here after a successful checkout. Verifies the signature (when a
// webhook secret is set) and marks the matching invoice paid.
export async function POST(req: NextRequest) {
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Stripe not enabled" }, { status: 400 });
  }
  const stripe = getStripe()!;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event;
  try {
    if (secret && sig) {
      event = stripe.webhooks.constructEvent(raw, sig, secret);
    } else {
      // No webhook secret configured — accept unverified (dev/local only).
      event = JSON.parse(raw);
    }
  } catch (err) {
    console.error("Stripe webhook signature error", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const invoiceId = event.data?.object?.metadata?.invoiceId;
    if (invoiceId) markInvoicePaid(invoiceId, event.data.object.id);
  }

  return NextResponse.json({ received: true });
}
