# Reinstall Steps

You already have `app/page.tsx` updated and `node_modules` installed with
`better-sqlite3`, `iron-session`, `zod`. This zip restores everything else
that didn't make it into GitHub.

## 1. Copy these into your project root, preserving folder structure:

```
proxy.ts                              → project root (next to package.json)
lib/db.ts
lib/auth.ts
lib/validators.ts
app/api/codes/validate/route.ts
app/api/codes/redeem/route.ts
app/api/admin/codes/route.ts
app/api/admin/codes/[id]/route.ts
app/api/admin/login/route.ts
app/api/admin/logout/route.ts
app/admin/page.tsx
app/admin/layout.tsx
app/admin/login/page.tsx
```

## 2. Make sure `.env.local` exists in the project root with:

```
ADMIN_PASSWORD=your-password-here
SESSION_SECRET=your-32-plus-char-secret-here
```

## 3. IMPORTANT — commit this to GitHub this time

Once it's all working locally, run:

```bash
git add .
git commit -m "Add discount code backend and admin UI"
git push
```

Double check with `git status` before committing that these show up as new
files — if they're greyed out or missing, your `.gitignore` may be too broad.

## 4. Run it

```bash
npm run dev
```

Visit `http://localhost:3000/admin`.
