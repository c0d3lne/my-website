"use client";

/**
 * GB Detailing — Premium homepage
 * Single-file Next.js (App Router) page using Tailwind v4 + React 19.
 * All copy, prices, and links are preserved from the original site.
 */

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

/* ─────────────────────────────────────────────
 * CONFIG (unchanged from original)
 * ─────────────────────────────────────────────*/
const PRICES = {
  exteriorClean: 25,
  interiorClean: 40,
  polishAddon: 10,
  dogHairAddon: 20,
  biohazardCleaning: 70,
  travelFee: 15,
  dropOffDiscount: 0.2,
  depositPercent: 0.1,
};

const AVAILABLE_DAYS = [1, 3, 6, 0]; // Mon, Wed, Sat, Sun
const TIME_SLOTS = [
  "10:00am",
  "11:00am",
  "12:00pm",
  "1:00pm",
  "2:00pm",
  "3:00pm",
  "4:00pm",
];

const CONTACT = {
  whatsapp: "4407594780797",
  messenger: "Gberrisdetails",
  phoneDisplay: "+44 07594 780 797",
  phoneHref: "tel:+4407594780797",
  facebook: "https://facebook.com/Gberrisdetails",
  instagram: "https://instagram.com/gb_detaling",
  tiktok: "https://tiktok.com/@gb_details",
};

/* ─────────────────────────────────────────────
 * DISCOUNT CODES — Admin Console
 * ─────────────────────────────────────────────
 * Add, edit, or remove codes by changing this array.
 * Codes are CASE-INSENSITIVE on the frontend.
 *
 *   type "percent"  →  `value` is a % off the running subtotal
 *                      (applied AFTER the drop-off discount)
 *   type "fixed"    →  `value` is a flat £ amount off
 *
 * To add a new code, copy a row and tweak it:
 *   { code: "MYCODE", type: "percent", value: 15, description: "15% off" },
 *
 * Once a real backend is wired up, this array will be replaced
 * by a fetch from /api/codes — see ADMIN_BACKEND_PROMPT.md.
 * ─────────────────────────────────────────────*/
type DiscountCode = {
  code: string;
  type: "percent" | "fixed";
  value: number;
  description?: string;
};

const DISCOUNT_CODES: DiscountCode[] = [
  { code: "WELCOME10", type: "percent", value: 10, description: "10% off · new customers" },
  { code: "VIP20", type: "percent", value: 20, description: "20% off · returning customers" },
  { code: "FIVER", type: "fixed", value: 5, description: "£5 off any booking" },
];

const findDiscountCode = (raw: string): DiscountCode | null => {
  const c = raw.trim().toUpperCase();
  if (!c) return null;
  return DISCOUNT_CODES.find((d) => d.code.toUpperCase() === c) ?? null;
};

/* ─────────────────────────────────────────────
 * HELPERS
 * ─────────────────────────────────────────────*/
const fmt = (n: number) => `£${n.toFixed(2)}`;
const cx = (...c: Array<string | false | undefined | null>) =>
  c.filter(Boolean).join(" ");

/* ─────────────────────────────────────────────
 * HOOKS
 * ─────────────────────────────────────────────*/
function useReveal<T extends HTMLElement>(rootMargin = "0px 0px -8% 0px") {
  const ref = useRef<T | null>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { rootMargin, threshold: 0.05 }
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [rootMargin]);
  return { ref, shown };
}

function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0] ?? "");
  useEffect(() => {
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((x): x is HTMLElement => Boolean(x));
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 0.75, 1] }
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, [ids]);
  return active;
}

function useScrollProgress() {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      setP(total > 0 ? Math.min(window.scrollY / total, 1) : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return p;
}

function useCountUp(target: number, duration = 500) {
  const [val, setVal] = useState(target);
  const prev = useRef(target);
  useEffect(() => {
    const start = prev.current;
    const delta = target - start;
    if (Math.abs(delta) < 0.005) {
      setVal(target);
      prev.current = target;
      return;
    }
    let raf = 0;
    const t0 = performance.now();
    const step = (t: number) => {
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(start + delta * eased);
      if (p < 1) raf = requestAnimationFrame(step);
      else prev.current = target;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

/* ─────────────────────────────────────────────
 * PRIMITIVES
 * ─────────────────────────────────────────────*/
function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const { ref, shown } = useReveal<HTMLDivElement>();
  return (
    <div
      ref={ref}
      data-shown={shown}
      className={cx("reveal", className)}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="inline-flex items-center gap-2.5 text-[11px] font-medium uppercase tracking-[0.32em] text-blue-300/90">
      <span className="relative inline-block h-1.5 w-1.5">
        <span className="absolute inset-0 rounded-full bg-blue-400" />
        <span className="absolute inset-0 rounded-full bg-blue-400 animate-pulse-dot" />
      </span>
      {children}
    </p>
  );
}

function GlassCard({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "hairline relative rounded-2xl bg-white/[0.025] backdrop-blur-[2px]",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────
 * AMBIENT DECOR
 * ─────────────────────────────────────────────*/
function GrainOverlay() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[2] h-full w-full opacity-[0.07] mix-blend-overlay"
    >
      <filter id="gb-grain">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.9"
          numOctaves="2"
          stitchTiles="stitch"
        />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#gb-grain)" />
    </svg>
  );
}

function Aurora() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="aurora-a absolute -left-32 -top-40 h-[44rem] w-[44rem] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(77,142,255,0.45), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="aurora-b absolute -right-40 top-1/3 h-[40rem] w-[40rem] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(120,80,255,0.32), transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="aurora-c absolute bottom-0 left-1/4 h-[46rem] w-[46rem] rounded-full"
        style={{
          background:
            "radial-gradient(closest-side, rgba(64,200,235,0.22), transparent 70%)",
          filter: "blur(50px)",
        }}
      />
    </div>
  );
}

function ScrollProgressBar() {
  const p = useScrollProgress();
  return (
    <div className="pointer-events-none fixed left-0 right-0 top-0 z-[60] h-px bg-white/[0.04]">
      <div
        className="h-full origin-left bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-400"
        style={{ transform: `scaleX(${p})` }}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────
 * ICON SET
 * ─────────────────────────────────────────────*/
const I = {
  spark: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="12" r="2.6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  drop: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 3.5c2.6 3.6 6 7.2 6 11a6 6 0 1 1-12 0c0-3.8 3.4-7.4 6-11z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 14.5c0 1.4 1 2.5 2.5 2.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  seat: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M6 20v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8 13V8a4 4 0 0 1 4-4h0a4 4 0 0 1 4 4v5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 20h16"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
  polish: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M4 17c2-1 4-1 6 0s4 1 6 0 4-1 4-1"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M5 12.5c2-1 3.5-1 5 0s3 1 4.5 0 4-1.5 4.5-1.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M14 4l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"
        fill="currentColor"
        opacity="0.85"
      />
    </svg>
  ),
  paw: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <ellipse cx="6" cy="10" rx="1.7" ry="2.2" fill="currentColor" />
      <ellipse cx="10" cy="6.5" rx="1.7" ry="2.2" fill="currentColor" />
      <ellipse cx="14" cy="6.5" rx="1.7" ry="2.2" fill="currentColor" />
      <ellipse cx="18" cy="10" rx="1.7" ry="2.2" fill="currentColor" />
      <path
        d="M12 11.5c-3 0-5 2.5-5 5 0 2 1.5 3 3 3 1 0 1.5-.5 2-.5s1 .5 2 .5c1.5 0 3-1 3-3 0-2.5-2-5-5-5z"
        fill="currentColor"
      />
    </svg>
  ),
  shield: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M12 3l8 3v6c0 4.5-3.4 7.9-8 9-4.6-1.1-8-4.5-8-9V6l8-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-4"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  truck: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M3 7h11v9H3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M14 10h5l2 3v3h-7"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="17.5" r="1.7" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  ),
  tag: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M3 12V4h8l10 10-8 8L3 12z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="8" cy="9" r="1.4" fill="currentColor" />
    </svg>
  ),
  arrow: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M5 12h14M13 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  check: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  ),
  messenger: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.654V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.974 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26L10.732 8l3.131 3.259L19.752 8l-6.561 6.963z" />
    </svg>
  ),
  phone: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M3 5a2 2 0 0 1 2-2h3.28a1 1 0 0 1 .948.684l1.498 4.493a1 1 0 0 1-.502 1.21l-2.257 1.13a11.042 11.042 0 0 0 5.516 5.516l1.13-2.257a1 1 0 0 1 1.21-.502l4.493 1.498a1 1 0 0 1 .684.949V19a2 2 0 0 1-2 2h-1C9.716 21 3 14.284 3 6V5z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  ),
  instagram: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <rect
        x="2.75"
        y="2.75"
        width="18.5"
        height="18.5"
        rx="5"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.3 6.3 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.69a8.18 8.18 0 0 0 4.79 1.53V6.77a4.84 4.84 0 0 1-1.03-.08z" />
    </svg>
  ),
  menu: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M4 7h16M4 12h16M4 17h16"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  ),
  chevronL: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M14 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  chevronR: (
    <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
      <path
        d="M10 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

/* ─────────────────────────────────────────────
 * BRAND MARK
 * ─────────────────────────────────────────────*/
function BrandMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="relative inline-flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-[10px]"
        style={{
          background:
            "linear-gradient(135deg, #4d8eff 0%, #2a4ec4 60%, #0f1d4a 100%)",
        }}
      />
      <span
        className="absolute inset-px rounded-[9px]"
        style={{
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.18), rgba(255,255,255,0) 45%), #0a1230",
        }}
      />
      <span className="relative font-black tracking-tight text-white" style={{ fontSize: size * 0.36 }}>
        GB
      </span>
    </span>
  );
}

/* ─────────────────────────────────────────────
 * NAV
 * ─────────────────────────────────────────────*/
function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const links = [
    { label: "Home", id: "home" },
    { label: "Quote", id: "quote" },
    { label: "About", id: "about" },
    { label: "Terms", id: "terms" },
  ];
  const active = useActiveSection(links.map((l) => l.id));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <nav
        className={cx(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "py-2" : "py-4"
        )}
      >
        <div className="mx-auto max-w-6xl px-4">
          <div
            className={cx(
              "hairline relative flex items-center justify-between rounded-full px-4 py-2 transition-all duration-500",
              scrolled
                ? "bg-[rgba(8,7,28,0.78)] backdrop-blur-xl"
                : "bg-[rgba(8,7,28,0.45)] backdrop-blur-md"
            )}
          >
            <a href="#home" className="group flex items-center gap-3 pl-1">
              <BrandMark size={32} />
              <span className="text-[15px] font-semibold tracking-wide text-white">
                GB <span className="text-blue-400">Detailing</span>
              </span>
            </a>

            <ul className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 md:flex">
              {links.map((l) => {
                const isActive = active === l.id;
                return (
                  <li key={l.id} className="relative">
                    <a
                      href={`#${l.id}`}
                      className={cx(
                        "relative block rounded-full px-4 py-1.5 text-[12px] font-medium uppercase tracking-[0.18em] transition-colors",
                        isActive
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      )}
                    >
                      {isActive && (
                        <span
                          aria-hidden
                          className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/10"
                        />
                      )}
                      {l.label}
                    </a>
                  </li>
                );
              })}
            </ul>

            <div className="flex items-center gap-2">
              <a
                href="#quote"
                className="cta-sweep relative hidden rounded-full bg-blue-500 px-4 py-2 text-[12px] font-semibold uppercase tracking-[0.16em] text-white shadow-[0_8px_24px_-6px_rgba(77,142,255,0.6)] transition-colors hover:bg-blue-400 md:inline-flex"
              >
                Book Now
              </a>
              <button
                onClick={() => setOpen((o) => !o)}
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-white md:hidden"
                aria-label="Toggle menu"
                aria-expanded={open}
              >
                <span className="block h-4 w-4">{open ? I.close : I.menu}</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sheet */}
      <div
        className={cx(
          "fixed inset-0 z-40 transition-opacity duration-300 md:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!open}
      >
        <div
          className="absolute inset-0 bg-[rgba(3,2,12,0.85)] backdrop-blur-xl"
          onClick={() => setOpen(false)}
        />
        <div
          className={cx(
            "relative flex h-full flex-col px-6 pt-28 pb-10 transition-transform duration-500",
            open ? "translate-y-0" : "-translate-y-6"
          )}
        >
          <ul className="space-y-2">
            {links.map((l, i) => (
              <li
                key={l.id}
                style={{
                  animation: open
                    ? `fade-up-stagger 600ms cubic-bezier(.16,1,.3,1) ${
                        i * 70
                      }ms both`
                    : "none",
                }}
              >
                <a
                  href={`#${l.id}`}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline justify-between border-b border-white/5 py-5 text-3xl font-black tracking-tight text-white"
                >
                  <span>{l.label}</span>
                  <span className="text-xs font-mono text-blue-400">
                    0{links.indexOf(l) + 1}
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <a
            href="#quote"
            onClick={() => setOpen(false)}
            className="cta-sweep mt-8 inline-flex items-center justify-center gap-3 rounded-full bg-blue-500 px-6 py-4 text-sm font-semibold uppercase tracking-[0.18em] text-white"
          >
            Book Now
            <span className="h-4 w-4">{I.arrow}</span>
          </a>
          <div className="mt-auto flex items-center justify-between pt-10 text-xs uppercase tracking-[0.22em] text-slate-500">
            <span>GB Detailing</span>
            <span>Cambridge, UK</span>
          </div>
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────
 * HERO
 * ─────────────────────────────────────────────*/
function HeroTile({
  className,
  label,
  index,
  icon,
  rotation,
}: {
  className: string;
  label: string;
  index: string;
  icon: ReactNode;
  rotation: string;
}) {
  return (
    <div
      className="group relative will-change-transform"
      style={{ transform: rotation }}
    >
      <div
        className={cx(
          "tile-shine relative aspect-[4/5] overflow-hidden rounded-[22px] border border-white/10 transition-transform duration-700 group-hover:-translate-y-2",
          className
        )}
        style={{
          boxShadow:
            "0 30px 60px -30px rgba(0,0,0,0.8), 0 8px 24px -10px rgba(77,142,255,0.18)",
        }}
      >
        {/* Decorative glow */}
        <div
          aria-hidden
          className="absolute -top-20 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full opacity-60"
          style={{
            background:
              "radial-gradient(closest-side, rgba(255,255,255,0.45), transparent)",
            filter: "blur(20px)",
          }}
        />
        {/* Index numeral */}
        <span
          aria-hidden
          className="absolute right-4 top-4 font-black tracking-tighter text-white/10"
          style={{ fontSize: "5rem", lineHeight: 1 }}
        >
          {index}
        </span>
        {/* Icon */}
        <span className="absolute left-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-white/5 text-white/85 backdrop-blur-sm">
          <span className="block h-5 w-5">{icon}</span>
        </span>
        {/* Bottom label bar */}
        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.32em] text-white/50">
              GB Detailing
            </p>
            <p className="mt-1 text-base font-semibold tracking-tight text-white">
              {label}
            </p>
          </div>
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-white/10 text-white/80 transition-all duration-300 group-hover:bg-white group-hover:text-blue-600">
            <span className="block h-3.5 w-3.5">{I.arrow}</span>
          </span>
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <section
      id="home"
      className="relative isolate flex min-h-[100svh] flex-col overflow-hidden pt-28 pb-24"
    >
      {/* Decorative bg layers */}
      <div
        aria-hidden
        className="bg-grid pointer-events-none absolute inset-0 opacity-[0.5]"
        style={{
          maskImage:
            "radial-gradient(80% 60% at 50% 30%, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(80% 60% at 50% 30%, black 30%, transparent 80%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-24 mx-auto h-px max-w-6xl"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(77,142,255,0.4), transparent)",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-6xl px-6">
        <Reveal>
          <div className="flex justify-center">
            <Eyebrow>
              Professional Car Detailing · Cambridge & Surrounding Areas
            </Eyebrow>
          </div>
        </Reveal>

        <Reveal delay={120}>
          <h1
            className="mx-auto mt-7 max-w-5xl text-center font-black leading-[0.95] text-white"
            style={{
              fontSize: "clamp(2.7rem, 8vw, 6.4rem)",
              letterSpacing: "-0.04em",
            }}
          >
            Your Car Deserves
            <br />
            <span
              className="animate-gradient-shift bg-clip-text text-transparent"
              style={{
                backgroundImage:
                  "linear-gradient(90deg, #93c5fd 0%, #60a5fa 35%, #67e8f9 60%, #c4b5fd 100%)",
              }}
            >
              The{" "}
              <em
                className="not-italic font-light"
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontStyle: "italic",
                  letterSpacing: "-0.02em",
                }}
              >
                Best.
              </em>
            </span>
          </h1>
        </Reveal>

        <Reveal delay={220}>
          <p className="mx-auto mt-7 max-w-xl text-center text-base leading-relaxed text-slate-400 sm:text-lg">
            GB Detailing delivers showroom-quality results at your doorstep.
            Expert interior &amp; exterior cleaning, polishing, and specialist
            biohazard services — done right, every time.
          </p>
        </Reveal>

        <Reveal delay={320}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="#quote"
              className="cta-sweep group inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 px-8 py-4 text-sm font-semibold tracking-wide text-white shadow-[0_18px_50px_-12px_rgba(77,142,255,0.7)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_60px_-12px_rgba(77,142,255,0.85)]"
            >
              Get a Quote
              <span className="block h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5">
                {I.arrow}
              </span>
            </a>
            <a
              href="#about"
              className="group inline-flex items-center justify-center gap-3 rounded-full border border-white/15 bg-white/[0.03] px-8 py-4 text-sm font-medium text-slate-200 backdrop-blur-sm transition-all hover:border-white/30 hover:bg-white/[0.08] hover:text-white"
            >
              Learn More
              <span className="block h-3.5 w-3.5 opacity-60 transition-all duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">
                {I.arrow}
              </span>
            </a>
          </div>
        </Reveal>

        <Reveal delay={420}>
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-400">
            {[
              { label: "5★ Rated", icon: I.spark },
              { label: "Mobile Service", icon: I.truck },
              { label: "Same-Week Booking", icon: I.check },
            ].map((b, i, arr) => (
              <span key={b.label} className="flex items-center gap-3">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-white/10 bg-white/[0.03] text-blue-300">
                  <span className="block h-3.5 w-3.5">{b.icon}</span>
                </span>
                <span className="tracking-wide">{b.label}</span>
                {i < arr.length - 1 && (
                  <span aria-hidden className="ml-2 hidden h-3 w-px bg-white/10 sm:block" />
                )}
              </span>
            ))}
          </div>
        </Reveal>

        {/* Image collage */}
        <Reveal delay={520}>
          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
              <div className="hidden sm:block">
                <HeroTile
                  className="tile-exterior animate-float-slower"
                  label="Exterior Detail"
                  index="01"
                  icon={I.drop}
                  rotation="rotate(-3deg) translateY(20px)"
                />
              </div>
              <HeroTile
                className="tile-polish animate-float-slow"
                label="Polish & Finish"
                index="02"
                icon={I.polish}
                rotation="rotate(0deg)"
              />
              <div className="hidden sm:block">
                <HeroTile
                  className="tile-interior animate-float-slower"
                  label="Interior Clean"
                  index="03"
                  icon={I.seat}
                  rotation="rotate(3deg) translateY(20px)"
                />
              </div>
              {/* Mobile only — show all stacked */}
              <div className="sm:hidden">
                <HeroTile
                  className="tile-exterior"
                  label="Exterior Detail"
                  index="01"
                  icon={I.drop}
                  rotation="rotate(0)"
                />
              </div>
              <div className="sm:hidden">
                <HeroTile
                  className="tile-interior"
                  label="Interior Clean"
                  index="03"
                  icon={I.seat}
                  rotation="rotate(0)"
                />
              </div>
            </div>
          </div>
        </Reveal>

        {/* Scroll cue */}
        <div className="mt-12 flex flex-col items-center gap-2 text-[11px] uppercase tracking-[0.3em] text-slate-500">
          <span>Scroll</span>
          <span className="relative block h-8 w-px overflow-hidden bg-white/5">
            <span className="absolute inset-x-0 top-0 block h-3 animate-scroll-cue bg-gradient-to-b from-blue-400 to-transparent" />
          </span>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32"
        style={{
          background: "linear-gradient(to bottom, transparent, var(--bg))",
        }}
      />
    </section>
  );
}

/* ─────────────────────────────────────────────
 * QUOTE / BOOKING
 * ─────────────────────────────────────────────*/
type ServiceKey = "exterior" | "interior" | "polish" | "dogHair" | "biohazard";

const SERVICE_DEFS: Array<{
  key: ServiceKey;
  label: string;
  price: number;
  note: string;
  icon: ReactNode;
  accent: string;
}> = [
  {
    key: "exterior",
    label: "Exterior Clean",
    price: PRICES.exteriorClean,
    note: "Base price — may vary by size/condition",
    icon: I.drop,
    accent: "from-blue-400/30 to-blue-600/10",
  },
  {
    key: "interior",
    label: "Interior Clean",
    price: PRICES.interiorClean,
    note: "Base price — may vary by size/condition",
    icon: I.seat,
    accent: "from-amber-300/25 to-amber-700/10",
  },
  {
    key: "polish",
    label: "Polish Add-on",
    price: PRICES.polishAddon,
    note: "Applied after exterior clean",
    icon: I.polish,
    accent: "from-cyan-300/25 to-cyan-600/10",
  },
  {
    key: "dogHair",
    label: "Dog Hair / Hazard Add-on",
    price: PRICES.dogHairAddon,
    note: "Excessive pet hair or general hazard",
    icon: I.paw,
    accent: "from-violet-400/25 to-violet-700/10",
  },
  {
    key: "biohazard",
    label: "Biohazard Cleaning",
    price: PRICES.biohazardCleaning,
    note: "Blood, vomit, urine, faeces etc. — minimum price",
    icon: I.shield,
    accent: "from-rose-400/25 to-rose-700/10",
  },
];

/* Calendar grid */
function CalendarGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (iso: string) => void;
}) {
  // Defer Date-dependent rendering to client to avoid SSR/CSR drift
  const [mounted, setMounted] = useState(false);
  const [today, setToday] = useState<Date | null>(null);
  const [view, setView] = useState<{ year: number; month: number } | null>(
    null
  );

  useEffect(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setToday(d);

    // Pick the first month containing at least one bookable date
    const hasAvailable = (year: number, month: number) => {
      const days = new Date(year, month + 1, 0).getDate();
      const startDay =
        year === d.getFullYear() && month === d.getMonth() ? d.getDate() : 1;
      for (let day = startDay; day <= days; day++) {
        if (AVAILABLE_DAYS.includes(new Date(year, month, day).getDay()))
          return true;
      }
      return false;
    };
    let y = d.getFullYear();
    let m = d.getMonth();
    if (!hasAvailable(y, m)) {
      const next = new Date(y, m + 1, 1);
      y = next.getFullYear();
      m = next.getMonth();
    }
    setView({ year: y, month: m });
    setMounted(true);
  }, []);

  const monthLabel = useMemo(() => {
    if (!view) return "";
    return new Date(view.year, view.month, 1).toLocaleDateString("en-GB", {
      month: "long",
      year: "numeric",
    });
  }, [view]);

  const grid = useMemo(() => {
    if (!view || !today) return [];
    const first = new Date(view.year, view.month, 1);
    const startWeekday = (first.getDay() + 6) % 7; // Mon=0 ... Sun=6
    const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
    const cells: Array<{
      date: Date | null;
      iso: string;
      enabled: boolean;
      isToday: boolean;
      isPast: boolean;
    }> = [];
    for (let i = 0; i < startWeekday; i++)
      cells.push({
        date: null,
        iso: "",
        enabled: false,
        isToday: false,
        isPast: false,
      });
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(view.year, view.month, d);
      // Build ISO from local date components — avoids timezone shifts
      const iso = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const isPast = date < today;
      const isAvailable = AVAILABLE_DAYS.includes(date.getDay());
      const isToday =
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate();
      cells.push({
        date,
        iso,
        enabled: isAvailable && !isPast,
        isToday,
        isPast,
      });
    }
    while (cells.length % 7 !== 0)
      cells.push({
        date: null,
        iso: "",
        enabled: false,
        isToday: false,
        isPast: false,
      });
    return cells;
  }, [view, today]);

  const canPrev = useMemo(() => {
    if (!view || !today) return false;
    const m = new Date(view.year, view.month, 1);
    const cur = new Date(today.getFullYear(), today.getMonth(), 1);
    return m > cur;
  }, [view, today]);

  const canNext = useMemo(() => {
    if (!view || !today) return false;
    const m = new Date(view.year, view.month, 1);
    const max = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    return m < max;
  }, [view, today]);

  const shift = (n: number) => {
    setView((v) => {
      if (!v) return v;
      const d = new Date(v.year, v.month + n, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  };

  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="h-9 w-9 rounded-full bg-white/[0.03]" />
          <span className="h-4 w-32 rounded bg-white/[0.05]" />
          <span className="h-9 w-9 rounded-full bg-white/[0.03]" />
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: 42 }).map((_, i) => (
            <span
              key={i}
              className="aspect-square rounded-lg bg-white/[0.02]"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => canPrev && shift(-1)}
          disabled={!canPrev}
          className={cx(
            "grid h-9 w-9 place-items-center rounded-full border transition-colors",
            canPrev
              ? "border-white/10 bg-white/[0.03] text-white hover:border-white/25"
              : "border-white/[0.04] text-slate-600 cursor-not-allowed"
          )}
          aria-label="Previous month"
        >
          <span className="block h-4 w-4">{I.chevronL}</span>
        </button>
        <p className="text-sm font-semibold tracking-wide text-white">
          {monthLabel}
        </p>
        <button
          type="button"
          onClick={() => canNext && shift(1)}
          disabled={!canNext}
          className={cx(
            "grid h-9 w-9 place-items-center rounded-full border transition-colors",
            canNext
              ? "border-white/10 bg-white/[0.03] text-white hover:border-white/25"
              : "border-white/[0.04] text-slate-600 cursor-not-allowed"
          )}
          aria-label="Next month"
        >
          <span className="block h-4 w-4">{I.chevronR}</span>
        </button>
      </div>

      <div className="mt-5 grid grid-cols-7 gap-1 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
          <span key={d} className="py-1.5">
            {d}
          </span>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {grid.map((c, i) => {
          if (!c.date)
            return <span key={i} className="aspect-square" aria-hidden />;
          const isSelected = value === c.iso;
          return (
            <button
              key={i}
              type="button"
              disabled={!c.enabled}
              onClick={() => c.enabled && onChange(c.iso)}
              className={cx(
                "relative aspect-square rounded-lg text-sm transition-all",
                !c.enabled && "text-slate-700 cursor-not-allowed",
                c.enabled &&
                  !isSelected &&
                  "text-white hover:bg-white/[0.06]",
                isSelected &&
                  "bg-blue-500 text-white shadow-[0_8px_28px_-10px_rgba(77,142,255,0.7)]"
              )}
            >
              <span className="relative">{c.date.getDate()}</span>
              {c.isToday && !isSelected && (
                <span
                  aria-hidden
                  className="absolute bottom-1 left-1/2 h-0.5 w-1.5 -translate-x-1/2 rounded-full bg-blue-400"
                />
              )}
            </button>
          );
        })}
      </div>

      <p className="mt-4 text-[11px] uppercase tracking-[0.18em] text-slate-500">
        Faded dates are unavailable
      </p>
    </div>
  );
}

function QuoteBooking() {
  const [services, setServices] = useState<Record<ServiceKey, boolean>>({
    exterior: false,
    interior: false,
    polish: false,
    dogHair: false,
    biohazard: false,
  });
  const [travelFee, setTravelFee] = useState(false);
  const [dropOff, setDropOff] = useState(false);
  const [carNotes, setCarNotes] = useState("");
  const [biohazardDetails, setBiohazardDetails] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [termsAgreed, setTermsAgreed] = useState(false);

  // Discount code state
  const [discountInput, setDiscountInput] = useState("");
  const [appliedCode, setAppliedCode] = useState<DiscountCode | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const tryApplyCode = () => {
    const found = findDiscountCode(discountInput);
    if (found) {
      setAppliedCode(found);
      setDiscountInput("");
      setCodeError(null);
    } else {
      setAppliedCode(null);
      setCodeError("That code isn't valid");
    }
  };
  const removeCode = () => {
    setAppliedCode(null);
    setCodeError(null);
  };

  const breakdown = useMemo(() => {
    const items: { label: string; amount: number }[] = [];
    if (services.exterior)
      items.push({
        label: "Exterior Clean (base)",
        amount: PRICES.exteriorClean,
      });
    if (services.interior)
      items.push({
        label: "Interior Clean (base)",
        amount: PRICES.interiorClean,
      });
    if (services.polish)
      items.push({ label: "Polish Add-on", amount: PRICES.polishAddon });
    if (services.dogHair)
      items.push({
        label: "Dog Hair / Hazard Add-on",
        amount: PRICES.dogHairAddon,
      });
    if (services.biohazard)
      items.push({
        label: "Biohazard Cleaning (min)",
        amount: PRICES.biohazardCleaning,
      });
    if (travelFee)
      items.push({ label: "Travel Fee", amount: PRICES.travelFee });
    let subtotal = items.reduce((a, i) => a + i.amount, 0);
    if (dropOff && subtotal > 0) {
      const dropOffAmount = subtotal * PRICES.dropOffDiscount;
      items.push({ label: "Drop-off Discount (20%)", amount: -dropOffAmount });
      subtotal -= dropOffAmount;
    }
    let codeAmount = 0;
    if (appliedCode && subtotal > 0) {
      codeAmount =
        appliedCode.type === "percent"
          ? subtotal * (appliedCode.value / 100)
          : Math.min(appliedCode.value, subtotal);
      const label =
        appliedCode.type === "percent"
          ? `Code "${appliedCode.code}" — ${appliedCode.value}% off`
          : `Code "${appliedCode.code}" — ${fmt(appliedCode.value)} off`;
      items.push({ label, amount: -codeAmount });
      subtotal -= codeAmount;
    }
    const deposit = subtotal * PRICES.depositPercent;
    return { items, subtotal, deposit };
  }, [services, travelFee, dropOff, appliedCode]);

  const animatedTotal = useCountUp(breakdown.subtotal, 380);

  const dayLabel = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const buildQuoteMessage = () => {
    const lines: string[] = [];
    lines.push("Hi GB Detailing! I'd like to get a quote 👋");
    lines.push("");
    lines.push("*Services requested:*");
    if (services.exterior)
      lines.push(`• Exterior Clean — £${PRICES.exteriorClean}`);
    if (services.interior)
      lines.push(`• Interior Clean — £${PRICES.interiorClean}`);
    if (services.polish)
      lines.push(`• Polish Add-on — +£${PRICES.polishAddon}`);
    if (services.dogHair)
      lines.push(`• Dog Hair / Hazard Add-on — +£${PRICES.dogHairAddon}`);
    if (services.biohazard)
      lines.push(`• Biohazard Cleaning — £${PRICES.biohazardCleaning}+`);
    if (travelFee) lines.push(`• Travel Fee — +£${PRICES.travelFee}`);
    if (dropOff) lines.push(`• Drop-off (20% discount applied)`);
    if (appliedCode) {
      const off =
        appliedCode.type === "percent"
          ? `${appliedCode.value}% off`
          : `£${appliedCode.value} off`;
      lines.push(`• Discount code: ${appliedCode.code} (${off})`);
    }
    lines.push("");
    lines.push(`*Estimated total: £${breakdown.subtotal.toFixed(2)}*`);
    if (selectedDate && selectedTime) {
      lines.push(`*Preferred date:* ${dayLabel(selectedDate)} at ${selectedTime}`);
    }
    if (carNotes) lines.push(`*Vehicle notes:* ${carNotes}`);
    if (services.biohazard && biohazardDetails)
      lines.push(`*Biohazard details:* ${biohazardDetails}`);
    if (name) lines.push(`*Name:* ${name}`);
    if (phone) lines.push(`*Phone:* ${phone}`);
    if (email) lines.push(`*Email:* ${email}`);
    return lines.join("\n");
  };

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(buildQuoteMessage());
    window.open(
      `https://wa.me/${CONTACT.whatsapp}?text=${msg}`,
      "_blank"
    );
  };

  const handleFacebook = () => {
    window.open(`https://m.me/${CONTACT.messenger}`, "_blank");
  };

  const toggle = (k: ServiceKey) =>
    setServices((s) => ({ ...s, [k]: !s[k] }));

  const selectedCount =
    Object.values(services).filter(Boolean).length +
    (travelFee ? 1 : 0) +
    (dropOff ? 1 : 0);

  const canSend = breakdown.subtotal > 0 && termsAgreed;

  return (
    <section
      id="quote"
      className="relative overflow-hidden border-t border-white/[0.04] py-24 px-6 sm:py-32"
    >
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="mb-14 text-center">
            <Eyebrow>Get In Touch · Step by Step</Eyebrow>
            <h2
              className="mt-5 font-black text-white"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Build your{" "}
              <span
                style={{
                  fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
                  fontStyle: "italic",
                  fontWeight: 300,
                }}
                className="text-blue-300"
              >
                quote
              </span>
              .
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-400">
              Pick your services, choose a date, and send the details directly
              via WhatsApp or Messenger — we&apos;ll confirm your booking and
              discuss next steps.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
          {/* LEFT — Form */}
          <div className="space-y-6">
            {/* Step 1 — Services */}
            <Reveal>
              <GlassCard className="p-7">
                <StepHeader
                  num="01"
                  title="Select Services"
                  hint={`${
                    Object.values(services).filter(Boolean).length
                  } selected`}
                />
                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVICE_DEFS.map((svc) => {
                    const checked = services[svc.key];
                    return (
                      <button
                        type="button"
                        key={svc.key}
                        onClick={() => toggle(svc.key)}
                        aria-pressed={checked}
                        className={cx(
                          "group relative overflow-hidden rounded-2xl border p-5 text-left transition-all duration-300",
                          checked
                            ? "border-blue-400/50 bg-blue-500/[0.07]"
                            : "border-white/[0.06] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]"
                        )}
                      >
                        <div
                          aria-hidden
                          className={cx(
                            "absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-60",
                            svc.accent,
                            checked && "opacity-90"
                          )}
                        />
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cx(
                              "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors",
                              checked
                                ? "border-blue-300/40 bg-blue-500/15 text-blue-200"
                                : "border-white/10 bg-white/[0.04] text-slate-300"
                            )}
                          >
                            <span className="block h-5 w-5">{svc.icon}</span>
                          </span>
                          <span
                            className={cx(
                              "text-base font-semibold transition-colors",
                              checked ? "text-blue-200" : "text-blue-300"
                            )}
                          >
                            {svc.key === "biohazard"
                              ? `£${svc.price}+`
                              : fmt(svc.price)}
                          </span>
                        </div>
                        <p className="mt-4 text-base font-semibold text-white">
                          {svc.label}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">
                          {svc.note}
                        </p>
                        <span
                          aria-hidden
                          className={cx(
                            "absolute right-4 top-4 grid h-5 w-5 place-items-center rounded-full border transition-all duration-300",
                            checked
                              ? "scale-100 border-transparent bg-blue-400 text-[#050415] opacity-100"
                              : "scale-90 border-white/10 bg-transparent opacity-0"
                          )}
                        >
                          <span className="block h-3 w-3">{I.check}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            </Reveal>

            {/* Step 2 — Service Options */}
            <Reveal delay={60}>
              <GlassCard className="p-7">
                <StepHeader num="02" title="Service Options" />
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <OptionToggle
                    checked={travelFee}
                    onChange={() => setTravelFee((v) => !v)}
                    icon={I.truck}
                    label="Mobile — We Come to You"
                    sub="Travel fee applies outside local area"
                    badge={`+${fmt(PRICES.travelFee)}`}
                    badgeClass="text-amber-300"
                  />
                  <OptionToggle
                    checked={dropOff}
                    onChange={() => setDropOff((v) => !v)}
                    icon={I.tag}
                    label="Drop-off at Our Location"
                    sub="Save 20% by dropping your car off yourself"
                    badge="−20%"
                    badgeClass="text-emerald-300"
                  />
                </div>
              </GlassCard>
            </Reveal>

            {/* Step 3 — Notes */}
            <Reveal delay={120}>
              <GlassCard className="p-7">
                <StepHeader num="03" title="Vehicle Notes" />
                <div className="mt-5 space-y-4">
                  <FieldLabel>Car size / condition notes</FieldLabel>
                  <textarea
                    rows={3}
                    placeholder="e.g. Large SUV, moderate dirt, been sitting for 3 months..."
                    value={carNotes}
                    onChange={(e) => setCarNotes(e.target.value)}
                    className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] p-4 text-sm text-white placeholder-slate-600 transition-colors focus:border-blue-400/50"
                  />
                  {services.biohazard && (
                    <div>
                      <div className="flex items-center justify-between">
                        <FieldLabel>
                          Biohazard details{" "}
                          <span className="text-rose-400">*required</span>
                        </FieldLabel>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="Please describe what the biohazard is and where it is located in the vehicle..."
                        value={biohazardDetails}
                        onChange={(e) => setBiohazardDetails(e.target.value)}
                        className="mt-2 w-full resize-none rounded-xl border border-rose-500/25 bg-rose-950/15 p-4 text-sm text-white placeholder-slate-600 transition-colors focus:border-rose-400/60"
                      />
                      <p className="mt-2 text-xs text-rose-300/70">
                        ⚠ Biohazard jobs are subject to inspection. Final price
                        confirmed on arrival.
                      </p>
                    </div>
                  )}
                </div>
              </GlassCard>
            </Reveal>

            {/* Step 4 — Date & Time */}
            <Reveal delay={180}>
              <GlassCard className="p-7">
                <StepHeader
                  num="04"
                  title="Choose a Date"
                  hint="Mon · Wed · Sat · Sun · 10am – 5pm"
                />
                <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,15rem)]">
                  <CalendarGrid
                    value={selectedDate}
                    onChange={(iso) => {
                      setSelectedDate(iso);
                      setSelectedTime("");
                    }}
                  />
                  <div>
                    <FieldLabel>
                      {selectedDate ? "Time slot" : "Pick a date first"}
                    </FieldLabel>
                    <div
                      className={cx(
                        "mt-3 grid grid-cols-2 gap-2 transition-opacity duration-300",
                        selectedDate ? "opacity-100" : "opacity-40"
                      )}
                    >
                      {TIME_SLOTS.map((t) => (
                        <button
                          type="button"
                          key={t}
                          disabled={!selectedDate}
                          onClick={() => setSelectedTime(t)}
                          className={cx(
                            "rounded-lg border px-3 py-2 text-xs font-medium transition-all",
                            selectedTime === t
                              ? "border-blue-400 bg-blue-500 text-white shadow-[0_10px_24px_-10px_rgba(77,142,255,0.7)]"
                              : "border-white/10 text-slate-300 hover:border-white/25 hover:text-white",
                            !selectedDate && "cursor-not-allowed"
                          )}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </GlassCard>
            </Reveal>

            {/* Step 5 — Contact */}
            <Reveal delay={240}>
              <GlassCard className="p-7">
                <StepHeader num="05" title="Your Details" />
                <div className="mt-5 grid gap-4 sm:grid-cols-3">
                  {[
                    {
                      label: "Full Name",
                      v: name,
                      set: setName,
                      ph: "John Smith",
                      type: "text",
                    },
                    {
                      label: "Phone Number",
                      v: phone,
                      set: setPhone,
                      ph: "07700 000000",
                      type: "tel",
                    },
                    {
                      label: "Email Address",
                      v: email,
                      set: setEmail,
                      ph: "john@example.com",
                      type: "email",
                    },
                  ].map((f) => (
                    <div key={f.label}>
                      <FieldLabel>{f.label}</FieldLabel>
                      <input
                        type={f.type}
                        placeholder={f.ph}
                        value={f.v}
                        onChange={(e) => f.set(e.target.value)}
                        className="mt-2 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white placeholder-slate-600 transition-colors focus:border-blue-400/50"
                      />
                    </div>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          </div>

          {/* RIGHT — Summary */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            <Reveal>
              <div
                className="hairline relative overflow-hidden rounded-2xl p-7"
                style={{
                  background:
                    "linear-gradient(160deg, rgba(77,142,255,0.08) 0%, rgba(8,7,28,0.6) 60%)",
                }}
              >
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full"
                  style={{
                    background:
                      "radial-gradient(closest-side, rgba(77,142,255,0.35), transparent)",
                    filter: "blur(20px)",
                  }}
                />
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-blue-300/80">
                  Live Quote
                </p>
                <div className="mt-3 flex items-baseline gap-2">
                  <span
                    className="font-black tracking-tight text-white"
                    style={{ fontSize: "clamp(2.4rem,5vw,3.4rem)" }}
                  >
                    {fmt(animatedTotal)}
                  </span>
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">
                    estimated
                  </span>
                </div>

                {breakdown.items.length === 0 ? (
                  <p className="mt-5 text-sm text-slate-400">
                    Select services to see your estimated quote build up here in
                    real time.
                  </p>
                ) : (
                  <ul className="mt-5 space-y-2">
                    {breakdown.items.map((item, i) => (
                      <li
                        key={i}
                        className="flex justify-between text-sm transition-opacity"
                      >
                        <span className="text-slate-400">{item.label}</span>
                        <span
                          className={
                            item.amount < 0
                              ? "font-medium text-emerald-300"
                              : "text-white"
                          }
                        >
                          {item.amount < 0
                            ? `−${fmt(Math.abs(item.amount))}`
                            : fmt(item.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}

                {/* Discount code */}
                <div className="mt-5">
                  {!appliedCode ? (
                    <>
                      <FieldLabel>Discount code</FieldLabel>
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          value={discountInput}
                          onChange={(e) => {
                            setDiscountInput(e.target.value);
                            if (codeError) setCodeError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              tryApplyCode();
                            }
                          }}
                          placeholder="Enter code"
                          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm uppercase tracking-wider text-white placeholder-slate-600 transition-colors focus:border-blue-400/50"
                        />
                        <button
                          type="button"
                          onClick={tryApplyCode}
                          disabled={!discountInput.trim()}
                          className={cx(
                            "shrink-0 rounded-xl px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] transition-colors",
                            discountInput.trim()
                              ? "bg-white/10 text-white hover:bg-white/15"
                              : "cursor-not-allowed bg-white/[0.03] text-slate-600"
                          )}
                        >
                          Apply
                        </button>
                      </div>
                      {codeError && (
                        <p className="mt-2 flex items-center gap-1.5 text-xs text-rose-300">
                          <span className="block h-3 w-3">{I.close}</span>
                          {codeError}
                        </p>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-emerald-400/30 bg-emerald-500/[0.06] px-4 py-3">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-400 text-[#050415]">
                          <span className="block h-3 w-3">{I.check}</span>
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-mono text-xs uppercase tracking-[0.18em] text-emerald-200">
                            {appliedCode.code}
                          </p>
                          {appliedCode.description && (
                            <p className="truncate text-[11px] text-emerald-100/70">
                              {appliedCode.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeCode}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full border border-white/10 text-slate-300 transition-colors hover:border-white/25 hover:text-white"
                        aria-label="Remove code"
                      >
                        <span className="block h-3.5 w-3.5">{I.close}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs text-slate-500">
                  <span>10% deposit · {fmt(breakdown.deposit)}</span>
                  {selectedDate && selectedTime && (
                    <span className="text-slate-300">
                      {dayLabel(selectedDate)} · {selectedTime}
                    </span>
                  )}
                </div>

                <p className="mt-4 text-[11px] leading-relaxed text-slate-500">
                  Final price confirmed after vehicle inspection.
                </p>

                {/* Terms */}
                <label
                  className={cx(
                    "mt-6 flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors",
                    termsAgreed
                      ? "border-blue-400/40 bg-blue-500/[0.06]"
                      : "border-white/10 bg-white/[0.02] hover:border-white/20"
                  )}
                >
                  <span
                    className={cx(
                      "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                      termsAgreed
                        ? "border-blue-400 bg-blue-500"
                        : "border-white/20 bg-white/[0.03]"
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={termsAgreed}
                      onChange={() => setTermsAgreed((v) => !v)}
                      className="sr-only"
                    />
                    {termsAgreed && (
                      <span className="block h-3 w-3 text-[#050415]">
                        {I.check}
                      </span>
                    )}
                  </span>
                  <span className="text-xs leading-relaxed text-slate-400">
                    I have read and agree to the{" "}
                    <a
                      href="#terms"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-300 underline-offset-4 hover:underline"
                    >
                      Terms &amp; Conditions
                    </a>{" "}
                    of GB Detailing. I understand the final price may vary based
                    on vehicle condition.
                  </span>
                </label>

                {/* Send buttons */}
                <div className="mt-4 space-y-3">
                  <button
                    onClick={handleWhatsApp}
                    disabled={!canSend}
                    className={cx(
                      "cta-sweep group flex w-full items-center justify-center gap-3 rounded-xl py-4 text-sm font-semibold transition-all duration-200",
                      canSend
                        ? "bg-[#25D366] text-white shadow-[0_14px_30px_-10px_rgba(37,211,102,0.55)] hover:-translate-y-0.5 hover:bg-[#1ebe5a]"
                        : "cursor-not-allowed bg-white/5 text-slate-600"
                    )}
                  >
                    <span className="block h-5 w-5">{I.whatsapp}</span>
                    {breakdown.subtotal === 0
                      ? "Select services to continue"
                      : !termsAgreed
                      ? "Agree to terms to continue"
                      : "Send Quote via WhatsApp"}
                  </button>
                  <button
                    onClick={handleFacebook}
                    disabled={!canSend}
                    className={cx(
                      "cta-sweep group flex w-full items-center justify-center gap-3 rounded-xl py-4 text-sm font-semibold transition-all duration-200",
                      canSend
                        ? "bg-[#0866FF] text-white shadow-[0_14px_30px_-10px_rgba(8,102,255,0.55)] hover:-translate-y-0.5 hover:bg-[#0052d4]"
                        : "cursor-not-allowed bg-white/5 text-slate-600"
                    )}
                  >
                    <span className="block h-5 w-5">{I.messenger}</span>
                    {canSend ? "Message Us on Facebook" : ""}
                  </button>
                </div>

                <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-500">
                  Your quote details will be sent automatically — we&apos;ll
                  confirm your booking and discuss next steps.
                </p>
              </div>
            </Reveal>
          </div>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4 pb-4 lg:hidden">
        <div
          className={cx(
            "pointer-events-auto hairline flex w-full max-w-md items-center justify-between gap-3 rounded-full bg-[rgba(8,7,28,0.92)] py-2 pl-5 pr-2 backdrop-blur-xl transition-all duration-500",
            selectedCount > 0
              ? "translate-y-0 opacity-100"
              : "translate-y-24 opacity-0"
          )}
        >
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
              Estimated Total
            </p>
            <p className="text-base font-bold text-white">
              {fmt(animatedTotal)}
            </p>
          </div>
          <a
            href="#quote"
            className="cta-sweep inline-flex items-center gap-2 rounded-full bg-blue-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-white"
          >
            Continue
            <span className="block h-3.5 w-3.5">{I.arrow}</span>
          </a>
        </div>
      </div>
    </section>
  );
}

function StepHeader({
  num,
  title,
  hint,
}: {
  num: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-8 w-8 place-items-center rounded-lg border border-white/10 bg-white/[0.03] font-mono text-xs text-blue-300">
          {num}
        </span>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>
      {hint && (
        <span className="text-[11px] uppercase tracking-[0.18em] text-slate-500">
          {hint}
        </span>
      )}
    </div>
  );
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-medium uppercase tracking-[0.2em] text-slate-400">
      {children}
    </label>
  );
}

function OptionToggle({
  checked,
  onChange,
  icon,
  label,
  sub,
  badge,
  badgeClass,
}: {
  checked: boolean;
  onChange: () => void;
  icon: ReactNode;
  label: string;
  sub: string;
  badge: string;
  badgeClass: string;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      aria-pressed={checked}
      className={cx(
        "group flex items-start gap-4 rounded-2xl border p-4 text-left transition-all duration-300",
        checked
          ? "border-blue-400/45 bg-blue-500/[0.06]"
          : "border-white/[0.06] bg-white/[0.02] hover:border-white/15"
      )}
    >
      <span
        className={cx(
          "grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-colors",
          checked
            ? "border-blue-300/40 bg-blue-500/15 text-blue-200"
            : "border-white/10 bg-white/[0.04] text-slate-300"
        )}
      >
        <span className="block h-5 w-5">{icon}</span>
      </span>
      <div className="flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white">{label}</span>
          <span className={cx("text-sm font-semibold", badgeClass)}>{badge}</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{sub}</p>
      </div>
      <span
        aria-hidden
        className={cx(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-all",
          checked
            ? "border-transparent bg-blue-400 text-[#050415]"
            : "border-white/15 bg-transparent"
        )}
      >
        {checked && <span className="block h-3 w-3">{I.check}</span>}
      </span>
    </button>
  );
}

/* ─────────────────────────────────────────────
 * ABOUT
 * ─────────────────────────────────────────────*/
function About() {
  return (
    <section
      id="about"
      className="relative overflow-hidden border-t border-white/[0.04] py-24 px-6 sm:py-32"
    >
      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-start gap-16 lg:grid-cols-2">
          <Reveal>
            <div>
              <Eyebrow>About Us</Eyebrow>
              <h2
                className="mt-5 font-black leading-[0.95] text-white"
                style={{
                  fontSize: "clamp(2.2rem, 5.6vw, 4rem)",
                  letterSpacing: "-0.035em",
                }}
              >
                Passion for
                <br />
                <span
                  style={{
                    fontFamily:
                      "var(--font-geist-mono), ui-monospace, monospace",
                    fontStyle: "italic",
                    fontWeight: 300,
                  }}
                  className="bg-gradient-to-r from-blue-300 to-cyan-200 bg-clip-text text-transparent"
                >
                  Perfection.
                </span>
              </h2>

              <div className="mt-8 space-y-5 text-base leading-relaxed text-slate-400">
                <p>
                  GB Detailing was founded on a simple belief: every car
                  deserves to be treated with care and expertise. Based in
                  Cambridge and serving the surrounding areas, we bring
                  professional detailing directly to your door — or you can
                  drop off with us for a discounted rate.
                </p>
                <p>
                  Whether it&apos;s a deep interior clean, a thorough exterior
                  wash and detail, or specialist biohazard cleaning, we
                  approach every job with the same attention to detail and
                  commitment to quality results.
                </p>
                <p>
                  We use professional-grade products and pride ourselves on
                  honest pricing and reliable service. No hidden fees — just a
                  clean car and a smile.
                </p>
              </div>

              <div className="mt-10">
                <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-slate-500">
                  Get In Touch
                </p>
                <div className="mt-4 space-y-2.5">
                  <ContactRow
                    href={CONTACT.phoneHref}
                    icon={I.phone}
                    label="Phone"
                    value={CONTACT.phoneDisplay}
                  />
                  <ContactRow
                    href={CONTACT.facebook}
                    external
                    icon={I.facebook}
                    label="Facebook"
                    value="@Gberrisdetails"
                  />
                  <ContactRow
                    href={CONTACT.instagram}
                    external
                    icon={I.instagram}
                    label="Instagram"
                    value="@gb_detaling"
                  />
                  <ContactRow
                    href={CONTACT.tiktok}
                    external
                    icon={I.tiktok}
                    label="TikTok"
                    value="@gb_details"
                  />
                </div>
              </div>
            </div>
          </Reveal>

          <Reveal delay={120}>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <PortfolioTile
                className="tile-exterior row-span-2 min-h-[300px]"
                label="Our Work"
                code="A · 01"
                icon={I.drop}
              />
              <PortfolioTile
                className="tile-interior min-h-[140px]"
                label="Team"
                code="B · 02"
                icon={I.seat}
              />
              <PortfolioTile
                className="tile-polish min-h-[140px]"
                label="Before & After"
                code="C · 03"
                icon={I.polish}
              />
              <PortfolioTile
                className="tile-exterior row-span-2 min-h-[300px]"
                label="Our Van"
                code="D · 04"
                icon={I.truck}
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

function PortfolioTile({
  className,
  label,
  code,
  icon,
}: {
  className: string;
  label: string;
  code: string;
  icon: ReactNode;
}) {
  return (
    <div
      className={cx(
        "tile-shine relative overflow-hidden rounded-2xl border border-white/8",
        className
      )}
    >
      <span className="absolute left-4 top-4 text-[10px] font-mono tracking-[0.2em] text-white/35">
        {code}
      </span>
      <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full border border-white/15 bg-white/[0.05] text-white/85 backdrop-blur-sm">
        <span className="block h-4 w-4">{icon}</span>
      </span>
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
        <p className="text-sm font-semibold tracking-tight text-white">
          {label}
        </p>
      </div>
    </div>
  );
}

function ContactRow({
  href,
  external,
  icon,
  label,
  value,
}: {
  href: string;
  external?: boolean;
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <a
      href={href}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      className="group flex items-center gap-4 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3 transition-all hover:border-white/15 hover:bg-white/[0.04]"
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.04] text-blue-300 transition-colors group-hover:border-blue-400/50 group-hover:text-blue-200">
        <span className="block h-4 w-4">{icon}</span>
      </span>
      <span className="flex-1">
        <span className="block text-[10px] font-medium uppercase tracking-[0.22em] text-slate-500">
          {label}
        </span>
        <span className="block text-sm font-medium text-white">{value}</span>
      </span>
      <span className="block h-3.5 w-3.5 -translate-x-2 text-slate-500 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:text-blue-300 group-hover:opacity-100">
        {I.arrow}
      </span>
    </a>
  );
}

/* ─────────────────────────────────────────────
 * TERMS
 * ─────────────────────────────────────────────*/
function Terms() {
  const terms = [
    {
      title: "General Service Agreement",
      body: "By booking with GB Detailing, the customer agrees to all terms outlined below. All services are carried out to a high professional standard; however, results may vary depending on the condition of the vehicle.",
      bullets: [],
    },
    {
      title: "Vehicle Condition and Pre-Existing Damage",
      body: "Customers must declare any pre-existing damage before the service begins. GB Detailing is not responsible for pre-existing damage including, but not limited to:",
      bullets: ["Scratches", "Paint defects", "Worn interiors", "Loose trims or components"],
      footer:
        "All vehicles are inspected prior to service. Photographs may be taken and recorded. Customers may be required to confirm existing damage before work begins.",
    },
    {
      title: "Biohazard and Specialist Cleaning",
      body: "Biohazard services (including blood, vomit, urine, feces, or other bodily fluids):",
      bullets: [
        "Must be clearly disclosed before booking",
        "Are subject to inspection before final pricing",
        "May be refused at the discretion of GB Detailing",
      ],
      footer: "Failure to disclose biohazards may result in cancellation without refund.",
    },
    {
      title: "Deposits and Payments",
      body: "A 10% deposit is required to secure all bookings. Deposits are non-refundable. The deposit will be deducted from the final balance. The remaining balance is due upon completion of the service.",
      bullets: [],
    },
    {
      title: "Cancellations",
      body: "Cancellations must be made at least 24 hours in advance. Failure to cancel within this time will result in loss of deposit.",
      bullets: [],
    },
    {
      title: "Time and Scheduling",
      body: "All service times are estimates only and may vary depending on vehicle condition. GB Detailing is not liable for delays caused by vehicle condition, weather, or unforeseen circumstances.",
      bullets: [],
    },
    {
      title: "Risk Disclaimer",
      body: "While every care is taken, detailing work may involve risk when working on aged paintwork, fragile materials, or previously damaged areas. GB Detailing will always act with care and professionalism but cannot be held responsible for issues arising from pre-existing wear or weakened materials.",
      bullets: [],
    },
    {
      title: "Mobile Service Requirements",
      body: "For mobile services, the customer must provide:",
      bullets: [
        "A minimum of 1.5 metres of working space",
        "Access to water",
        "Access to electricity",
        "A safe working environment",
      ],
      footer:
        "GB Detailing reserves the right to refuse or cancel a booking if conditions are unsuitable. Work may be stopped at any time if safety becomes a concern. In such cases, no refund will be issued.",
    },
    {
      title: "Pricing Adjustments",
      body: "Final pricing may vary depending on vehicle size, condition, or undisclosed issues. Customers will be informed of any additional charges before work continues.",
      bullets: [],
    },
    {
      title: "Photography and Media",
      body: "GB Detailing may take before and after photographs for documentation, quality control, and marketing purposes. Vehicle registration plates and personal details will be concealed. Customers may request that their vehicle is not used for marketing. Permission will always be requested prior to publishing images.",
      bullets: [],
    },
    {
      title: "Agreement",
      body: "By booking a service, the customer confirms they have read and agreed to these Terms and Conditions.",
      bullets: [],
    },
  ];

  const [updated] = useState(() =>
    new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" })
  );

  return (
    <section
      id="terms"
      className="relative overflow-hidden border-t border-white/[0.04] py-24 px-6 sm:py-32"
    >
      <div className="relative mx-auto max-w-4xl">
        <Reveal>
          <div className="mb-14 text-center">
            <Eyebrow>Legal · Service Agreement</Eyebrow>
            <h2
              className="mt-5 font-black text-white"
              style={{
                fontSize: "clamp(2rem, 5vw, 3.6rem)",
                letterSpacing: "-0.03em",
              }}
            >
              Terms &amp;{" "}
              <span
                style={{
                  fontFamily:
                    "var(--font-geist-mono), ui-monospace, monospace",
                  fontStyle: "italic",
                  fontWeight: 300,
                }}
                className="text-blue-300"
              >
                Conditions
              </span>
            </h2>
            <p className="mt-3 text-sm text-slate-500">
              Last updated: {updated}
            </p>
          </div>
        </Reveal>

        <div className="space-y-3">
          {terms.map((t, i) => (
            <Reveal key={t.title} delay={i * 30}>
              <article
                className="hairline relative rounded-2xl bg-white/[0.02] p-6 transition-colors hover:bg-white/[0.035] sm:p-7"
              >
                <div className="flex gap-5">
                  <div className="flex flex-col items-center">
                    <span className="font-mono text-xs tracking-wide text-blue-300/70">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span
                      aria-hidden
                      className="mt-2 h-full w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, rgba(77,142,255,0.45), transparent)",
                      }}
                    />
                  </div>
                  <div className="flex-1 pb-1">
                    <h4 className="text-base font-semibold tracking-tight text-white">
                      {t.title}
                    </h4>
                    <p className="mt-2 text-sm leading-relaxed text-slate-400">
                      {t.body}
                    </p>
                    {t.bullets && t.bullets.length > 0 && (
                      <ul className="mt-3 space-y-1.5">
                        {t.bullets.map((b) => (
                          <li
                            key={b}
                            className="flex items-start gap-2.5 text-sm text-slate-400"
                          >
                            <span
                              aria-hidden
                              className="mt-2 block h-px w-3 shrink-0 bg-blue-400/60"
                            />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                    {"footer" in t && t.footer && (
                      <p className="mt-3 text-sm leading-relaxed text-slate-400">
                        {t.footer}
                      </p>
                    )}
                  </div>
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <p className="mt-12 text-center text-xs text-slate-600">
          By booking with GB Detailing, you agree to all of the above terms and
          conditions. For questions, contact us via the details in the About
          section.
        </p>
      </div>
    </section>
  );
}

/* ─────────────────────────────────────────────
 * FOOTER
 * ─────────────────────────────────────────────*/
function Footer() {
  return (
    <footer className="relative overflow-hidden border-t border-white/[0.04] px-6 py-16">
      <div className="relative mx-auto max-w-6xl">
        <Reveal>
          <div className="grid gap-10 md:grid-cols-[1.4fr_1fr_1fr]">
            <div>
              <div className="flex items-center gap-3">
                <BrandMark size={40} />
                <div>
                  <p className="text-base font-semibold tracking-tight text-white">
                    GB <span className="text-blue-400">Detailing</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    Cambridge, UK · Mobile &amp; Drop-off
                  </p>
                </div>
              </div>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-slate-400">
                Showroom-quality detailing at your doorstep. Honest pricing,
                reliable service, and serious attention to detail.
              </p>
              <a
                href="#quote"
                className="cta-sweep mt-6 inline-flex items-center gap-2 rounded-full bg-blue-500 px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_10px_30px_-10px_rgba(77,142,255,0.6)] transition-colors hover:bg-blue-400"
              >
                Book Now
                <span className="block h-3.5 w-3.5">{I.arrow}</span>
              </a>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                Navigate
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  ["Home", "#home"],
                  ["Quote", "#quote"],
                  ["About", "#about"],
                  ["Terms", "#terms"],
                ].map(([l, h]) => (
                  <li key={l}>
                    <a
                      href={h}
                      className="text-slate-400 transition-colors hover:text-white"
                    >
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-slate-500">
                Connect
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href={CONTACT.phoneHref}
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    {CONTACT.phoneDisplay}
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    Facebook
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href={CONTACT.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-400 transition-colors hover:text-white"
                  >
                    TikTok
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </Reveal>

        <div className="mt-14 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 text-xs text-slate-600 md:flex-row">
          <p>
            © {new Date().getFullYear()} GB Detailing. All rights reserved.
            Professional Car Detailing · Cambridge, UK.
          </p>
          <p className="font-mono tracking-wider">v.0.1 · made with care</p>
        </div>
      </div>
    </footer>
  );
}

/* ─────────────────────────────────────────────
 * MAIN
 * ─────────────────────────────────────────────*/
export default function Home() {
  return (
    <main className="relative isolate min-h-screen text-white">
      <Aurora />
      <GrainOverlay />
      <ScrollProgressBar />
      <Nav />
      <Hero />
      <QuoteBooking />
      <About />
      <Terms />
      <Footer />
    </main>
  );
}
