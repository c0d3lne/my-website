"use client";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";

const TABS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/invoices", label: "Invoices" },
  { href: "/admin/calendar", label: "Calendar" },
  { href: "/admin/travel", label: "Travel" },
  { href: "/admin/codes", label: "Codes" },
];

export default function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // No chrome on the login screen.
  if (pathname === "/admin/login") return null;

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <header
      className="border-b border-white/[0.07] sticky top-0 z-30 backdrop-blur"
      style={{ background: "rgba(5,4,21,0.85)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
            style={{ background: "var(--accent)", color: "#fff", fontFamily: "var(--font-geist-mono)" }}
          >
            GB
          </div>
          <h1 className="text-white font-semibold text-base hidden sm:block">Admin</h1>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              className={`whitespace-nowrap rounded-full px-3.5 py-1.5 text-[12px] font-medium uppercase tracking-[0.12em] transition-colors ${
                isActive(t.href)
                  ? "bg-white/[0.08] text-white ring-1 ring-inset ring-white/10"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <button onClick={signOut} className="a-btn-ghost shrink-0 !py-1.5 !px-3 !text-xs">
          Sign out
        </button>
      </div>
    </header>
  );
}
