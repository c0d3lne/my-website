# GB Detailing — Handoff

Hey! You're picking up a small Next.js marketing site for **GB Detailing**, a Cambridge-based car-detailing business. The whole front end is finished and tested. The job left for you is wiring up a real backend for the **discount-code** feature so the owner can manage codes from an admin UI without editing source.

There's a self-contained, paste-into-Claude spec for that work in **[`ADMIN_BACKEND_PROMPT.md`](./ADMIN_BACKEND_PROMPT.md)** — drop the whole file into your Claude session and it has all the context it needs to start. This file is the friendlier orientation read for you.

---

## Quick start

```bash
npm install
npm run dev
# http://localhost:3000
```

Node 20+ recommended. That's it — no env vars yet, no database yet.

---

## Stack

- **Next.js 16** (App Router) — note the AGENTS.md warning: there are breakages from older Next versions, prefer `node_modules/next/dist/docs/` over training data when something looks weird
- **React 19**
- **Tailwind v4** — config lives in `app/globals.css` via `@theme inline`, no `tailwind.config` file
- **TypeScript** strict
- **Geist Sans / Geist Mono** via `next/font`

---

## Repo layout

```
.
├── app/
│   ├── globals.css           Theme tokens + custom keyframes
│   ├── layout.tsx            Root + Geist fonts
│   └── page.tsx              The whole site, ~1500 LOC, "use client"
├── public/                   Default svg assets
├── ADMIN_BACKEND_PROMPT.md   ← paste this into Claude to start the work
├── HANDOFF.md                ← this file
├── README.md                 Default Next.js readme
├── AGENTS.md / CLAUDE.md     Repo-wide notes
├── package.json
├── package-lock.json
├── tsconfig.json
├── next.config.ts
├── eslint.config.mjs
├── postcss.config.mjs
└── .gitignore
```

---

## What's already built — DO NOT touch

- The full public site: nav, hero, services / booking, calendar, about, terms, footer
- The discount-code UI inside the booking flow — input, Apply button, error state, applied-code chip with remove, breakdown line, WhatsApp/Messenger message integration
- Booking math (verified): services + add-ons + travel → drop-off discount (20%) → code discount → 10% deposit calc on final total
- Mobile / tablet / desktop layouts
- All copy, prices, available days, time slots, and contact links match what the owner signed off on

If you find yourself tempted to redesign anything visible, stop. The only `page.tsx` edits called out in the spec are the **four lines** that swap a local discount-code lookup for an API call.

---

## What you're building

End-to-end backend + admin UI for the discount codes. Full spec is in `ADMIN_BACKEND_PROMPT.md`. The TL;DR:

- **DB** SQLite via `better-sqlite3` (zero config, single file)
- **Auth** `iron-session` cookie, single shared password from `ADMIN_PASSWORD` env var
- **Public API** `GET /api/codes/validate?code=...` and `POST /api/codes/redeem`
- **Admin API** full CRUD under `/api/admin/codes` behind cookie auth
- **Admin UI** at `/admin` — login, dashboard with table, create/edit/delete dialog, matches the dark blue glass aesthetic of the public site

---

## Where the discount logic currently lives

Open `app/page.tsx` and search for these:

| Symbol | What it does | What to do |
|---|---|---|
| `type DiscountCode` | The shape used by the frontend | Keep, but mark non-public fields optional |
| `const DISCOUNT_CODES` | Hard-coded list of 3 sample codes | **Delete** — replace with API call |
| `findDiscountCode(raw)` | Local lookup helper | **Delete** |
| `tryApplyCode()` (inside `QuoteBooking`) | What runs when user clicks Apply | Replace its body with a `fetch('/api/codes/validate?code=...')` |
| `handleWhatsApp` / `handleFacebook` | Send-quote handlers | Add a fire-and-forget `fetch('/api/codes/redeem', ...)` if a code was applied |

The applied-code chip, the input + Apply button, the error UI, and the breakdown line are all already wired and styled. **You don't need to touch JSX.**

---

## Design tokens to reuse in the admin UI

From `app/globals.css`:

- Background: `var(--bg)` = `#050415`
- Accent: `var(--accent)` = `#4d8eff`, hover lighter: `#60a5fa`
- Glass surface: `bg-white/[0.025]` + `backdrop-blur`
- Hairline border utility: add the `.hairline` class to any rounded container
- Body font: Geist Sans
- Accent font (numerals, codes, italic flourishes): Geist Mono italic

Match the look. The owner cares about it.

---

## Acceptance criteria

1. Owner logs into `/admin`, creates a `LOYAL15` code (15% off, expires 2026-12-31, max 50 uses), and immediately uses it on the public booking form
2. Editing or deactivating in admin updates what the public form accepts on the next validate call
3. Deleting a code makes it invalid immediately
4. Sending a quote with a code applied increments `usedCount` by 1
5. Unauthenticated requests to `/admin` or `/api/admin/*` get 401 / redirect to login
6. The public site looks identical to before — same copy, same prices, same layout

---

## Out of scope (skip unless asked)

- Per-customer email tracking
- CSV bulk import
- Min-subtotal requirement per code
- Multi-admin / role permissions
- i18n, analytics dashboards beyond `usedCount`

---

## If you hit a wall

Stop and message the owner with the specific decision you need. The spec is intentionally conservative — when in doubt, ship the boring obvious version. Cheers.
