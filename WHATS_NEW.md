# GB Detailing — What's New

This build keeps the existing site design exactly as-is and adds a customer
portal, a full admin back-office, a real booking calendar, automatic travel
charges, invoicing, before/after photos, referrals, and a deposit /
cancellation policy. Nothing about the look, colours, fonts or layout changed.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
# production:  npm run build && npm start
```

Requires Node 20+. Everything works out of the box with SQLite — no database
setup. A `data/gb.db` file is created automatically on first run.

### Environment (`.env.local`)
- `ADMIN_PASSWORD` — password for the admin panel (already set).
- `SESSION_SECRET` — 32+ char secret for login sessions (already set).
- **Optional** Stripe (leave blank to keep online payments off — you can still
  mark invoices paid by hand):
  - `STRIPE_SECRET_KEY`
  - `STRIPE_WEBHOOK_SECRET` (point a Stripe webhook at `/api/stripe/webhook`)
  - `NEXT_PUBLIC_SITE_URL` (your live domain, for Stripe return links)

## For customers — `/dashboard`
Customers create an account (needed for referrals) and can:
- See their **referral code**, progress ("2 / 5 referrals") and reward status.
- View & **download invoices as PDF**, and **pay** unpaid ones (if Stripe is on).
- See **before & after photos** for their jobs.
- View **their bookings** and cancel them within policy (see below).
Invoices are **read-only** to customers — only you can create/edit/delete them.

## For you — `/admin`
Sign in at `/admin`. Sections:
- **Dashboard** — totals + a notification when a customer earns their free wash.
- **Bookings** — every booking, change status, mark **deposit paid**, upload
  before/after photos. Completing a referred booking counts the referral.
- **Customers** — full profiles: contact details, booking history, invoices,
  referral progress, photos. One-click email.
- **Invoices** — create / edit / mark paid / email (opens your mail app with a
  link) / download PDF. New invoices appear in the customer's dashboard instantly.
- **Calendar** — every day is bookable by default; click a day to switch it off.
  Booked slots are blocked automatically (no double bookings).
- **Travel** — edit included areas (Warboys, Ramsey, Upwood = free), per-area /
  postcode charges, the default charge, and referral rules.
- **Codes** — the original discount codes (unchanged).

## Deposit & cancellation policy (enforced in code)
- A 10% deposit is shown on every booking; you mark it paid in Bookings.
- Customers can cancel from their dashboard, but:
  - **≥ 48 hours' notice** → deposit **refundable**.
  - **24–48 hours' notice** → cancel allowed, deposit **forfeited**.
  - **under 24 hours** → no online cancel; they must contact you.
- Cancelling a referred booking removes the referral credit.
(Refunds themselves are handled by you — the system tracks and messages the
policy; it doesn't auto-charge or auto-refund deposits.)

## Notes
- `data/` (the database) and `public/uploads/` (photos) are git-ignored runtime
  folders — they're created automatically and left out of this package.
- One fix included: `proxy.ts` now lets the admin login API through (it was
  previously blocked, so admin login could never succeed), and a debug line
  that logged the admin password to the server console was removed.
