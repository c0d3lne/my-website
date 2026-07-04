import { NextRequest, NextResponse } from "next/server";
import { sessionOptions } from "./lib/auth";
import type { SessionData } from "./lib/auth";

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page and its API must be reachable without a session, otherwise
  // there is no way to ever obtain one.
  if (pathname === "/admin/login" || pathname === "/api/admin/login")
    return NextResponse.next();

  const cookieValue = req.cookies.get(sessionOptions.cookieName as string)?.value;

  if (!cookieValue) {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    const { unsealData } = await import("iron-session");
    const session = await unsealData<SessionData>(cookieValue, {
      password: process.env.SESSION_SECRET as string,
    });

    if (!session.isAdmin) {
      if (pathname.startsWith("/api/admin")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }
  } catch {
    if (pathname.startsWith("/api/admin")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
