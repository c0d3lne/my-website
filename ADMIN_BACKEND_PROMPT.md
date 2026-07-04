# Discount-Code Backend & Admin UI — Implementation Prompt

> Paste this whole file as your first message to Claude. It is self-contained — Claude does not need to ask the previous developer anything to start.

---

## Project context

You're inheriting a **Next.js 16 (App Router) + React 19 + Tailwind v4** marketing site for **GB Detailing**, a car-detailing business in Cambridge, UK. There is currently a single page at `app/page.tsx` and the booking form already has a working **frontend-only** discount-code flow that reads from a hard-coded array.

Your job: replace that hard-coded array with a real backend so the owner can manage codes through an admin UI without touching source code.

**Repo layout (relevant parts):**
```
app/
  page.tsx          ← booking form lives here (do not redesign it)
  layout.tsx
  globals.css
package.json
ADMIN_BACKEND_PROMPT.md   ← this file
```

**What's already wired up on the frontend** (search `page.tsx` for these names):
- `type DiscountCode = { code: string; type: "percent" | "fixed"; value: number; description?: string }`
- `const DISCOUNT_CODES: DiscountCode[]` — the hard-coded list to replace
- `findDiscountCode(raw)` — the local lookup function to replace with an API call
- `tryApplyCode()` inside `QuoteBooking` — the handler that runs when the user clicks **Apply**
- The breakdown math, applied-code chip, and error state are all already styled — **do not touch them**

---

## Data model

Add these fields beyond what's used today. Server is the source of truth:

```ts
type DiscountCode = {
  id: string;          // uuid, server-generated
  code: string;        // unique, uppercased server-side, 3-32 chars, /^[A-Z0-9_-]+$/
  type: "percent" | "fixed";
  value: number;       // 1-100 if percent; positive £ if fixed
  description?: string;
  active: boolean;     // soft on/off without deleting
  expiresAt?: string;  // ISO datetime, optional
  maxUses?: number;    // optional cap; null = unlimited
  usedCount: number;   // increments on redemption
  createdAt: string;
  updatedAt: string;
};
```

A code is **valid** when: `active === true` AND (`expiresAt` is unset OR in the future) AND (`maxUses` is unset OR `usedCount < maxUses`).

---

## Stack & deps to add

- **DB**: SQLite via `better-sqlite3` (synchronous, zero-config, perfect for a small business). One file at `data/gb.db`. Add `data/` to `.gitignore`.
- **Sessions**: `iron-session` for HTTP-only signed cookies.
- **Validation**: `zod` for request bodies.

Install: `npm i better-sqlite3 iron-session zod` and `npm i -D @types/better-sqlite3`.

---

## Env vars (`.env.local`)

```
ADMIN_PASSWORD=change-me-to-something-long
SESSION_SECRET=at-least-32-random-characters-here
```

Document both in the README.

---

## API routes (App Router under `app/api/`)

### Public
- `GET /api/codes/validate?code=ABC`
  - Looks up by code (case-insensitive). Returns `200 { code, type, value, description }` if valid; else `404 { error: "invalid" }`.
  - Never returns `id`, `usedCount`, `maxUses`, etc. to the public.

- `POST /api/codes/redeem`
  - Body: `{ code: "ABC" }`. Increments `usedCount` if the code is still valid. Always returns `200` (best-effort, fire-and-forget from the frontend). No-op for invalid/expired codes.

### Admin (require auth via `middleware.ts`)
- `GET /api/admin/codes` — list all codes
- `POST /api/admin/codes` — create. Body validated with zod. Reject duplicate `code`.
- `PATCH /api/admin/codes/:id` — partial update
- `DELETE /api/admin/codes/:id` — hard delete

### Auth
- `POST /api/admin/login` — body `{ password }`. If matches `ADMIN_PASSWORD`, set iron-session cookie and return `200`. Otherwise `401`.
- `POST /api/admin/logout` — clears cookie.

`middleware.ts` should protect `/api/admin/*` and `/admin` (not `/admin/login` itself, but the dashboard and API routes). Redirect unauthenticated `/admin` requests to `/admin/login`.

---

## Admin UI at `/admin`

Match the existing site's aesthetic — dark, glassy, blue accent. Re-use these design tokens from `app/globals.css`:
- Background: `var(--bg)` = `#050415`
- Accent: `var(--accent)` = `#4d8eff`
- Hairline borders: the `.hairline` utility class
- Glass surfaces: `bg-white/[0.025]` with `backdrop-blur`
- Geist Sans body, Geist Mono italic for accents (e.g. on numerals or codes)

### `/admin/login`
Single password field, "Sign in" button. On success → `/admin`. Show inline error on 401.

### `/admin` dashboard
- Page header: "Discount Codes" + "New code" button + "Sign out"
- Table of codes with columns:
  - Code (mono, uppercase)
  - Type (Percent / Fixed pill)
  - Value (`10%` or `£5.00`)
  - Active (toggle switch — flips via PATCH)
  - Used (`{usedCount}` / `{maxUses ?? "∞"}`)
  - Expires (formatted date or "—")
  - Actions: edit / delete
- Empty state: "No codes yet — create your first one."
- "New code" opens a modal/drawer with form fields:
  - Code (auto-uppercased as user types)
  - Type (radio: Percent / Fixed)
  - Value (number input with appropriate suffix)
  - Description (optional)
  - Expires at (optional datetime-local input)
  - Max uses (optional number input)
  - Active (default true)
- Edit re-uses the same form, prefilled.
- Delete shows a confirm dialog ("Delete code WELCOME10? This cannot be undone.").

Use server-action mutations or client `fetch` — your call. Optimistic updates are nice but not required.

---

## Frontend wiring (the only changes you should make to `app/page.tsx`)

1. **Delete** the `DISCOUNT_CODES` constant and the `findDiscountCode` helper (lines 51–82 in the current file — the comment block above them too).
2. Keep the `DiscountCode` type but mark all fields besides what the validate endpoint returns as optional, since the public response is trimmed.
3. Replace `tryApplyCode` so it calls the API:
   ```ts
   const tryApplyCode = async () => {
     const c = discountInput.trim();
     if (!c) return;
     setCodeError(null);
     try {
       const res = await fetch(`/api/codes/validate?code=${encodeURIComponent(c)}`);
       if (res.ok) {
         const code = await res.json();
         setAppliedCode(code);
         setDiscountInput("");
       } else {
         setAppliedCode(null);
         setCodeError("That code isn't valid");
       }
     } catch {
       setCodeError("Couldn't check code — try again");
     }
   };
   ```
4. In `handleWhatsApp` / `handleFacebook`, after `window.open(...)`, fire-and-forget:
   ```ts
   if (appliedCode) {
     fetch("/api/codes/redeem", {
       method: "POST",
       headers: { "Content-Type": "application/json" },
       body: JSON.stringify({ code: appliedCode.code }),
     }).catch(() => {});
   }
   ```

**Do not** modify any copy, prices, layout, or styling on the public site. The booking math (drop-off then code) is correct — leave it alone.

---

## Files you should create

```
data/                       (gitignored)
lib/
  db.ts                     SQLite connection, schema migration, query helpers
  auth.ts                   iron-session config + password check
  validators.ts             zod schemas for create/update
middleware.ts               protects /admin and /api/admin/*
app/
  api/
    codes/
      validate/route.ts
      redeem/route.ts
    admin/
      codes/route.ts        GET, POST
      codes/[id]/route.ts   PATCH, DELETE
      login/route.ts        POST
      logout/route.ts       POST
  admin/
    layout.tsx              auth-aware shell + signed-in nav
    page.tsx                dashboard
    login/page.tsx          login form
```

---

## Acceptance criteria

- Owner can log into `/admin`, create a code (e.g. `LOYAL15` → 15% off, expires 2026-12-31, max 50 uses), and immediately use it on the public booking form.
- Editing a code in admin updates what the public form accepts on the next validate call (no caching).
- Deleting a code makes it invalid immediately.
- Invalid / expired / exhausted codes return 404 from `/api/codes/validate`.
- An unauthenticated request to any `/api/admin/*` route or `/admin` returns 401 / redirects to login.
- The public page still works exactly as it does today (visually unchanged).
- After a customer sends a quote with a code applied, `usedCount` increments by 1.

---

## Out of scope (don't build unless asked)

- Per-customer email tracking
- CSV bulk import
- Min-subtotal requirement per code
- Multi-admin / role permissions
- Internationalization
- Analytics dashboards beyond the `usedCount` column

Stop and ask the owner if you hit a design decision not covered here. Otherwise, build it end-to-end and confirm in the browser before handing back.
