import Stripe from "stripe";

// Stripe is optional: if no secret key is configured the "Pay now" flow is
// hidden and the owner can still mark invoices paid manually in the admin.
let _stripe: Stripe | null = null;

export function stripeConfigured(): boolean {
  return !!process.env.STRIPE_SECRET_KEY;
}

export function getStripe(): Stripe | null {
  if (!stripeConfigured()) return null;
  if (!_stripe) {
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return _stripe;
}

// Base URL for building Stripe success/cancel redirect links.
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    "http://localhost:3000"
  );
}
