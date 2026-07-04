import { getIronSession, SessionOptions } from "iron-session";
import { cookies } from "next/headers";

// Customer portal session — separate cookie from the admin session so the two
// logins never collide. Reuses the same SESSION_SECRET.
export type CustomerSessionData = {
  customerId?: string;
  email?: string;
};

export const customerSessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET as string,
  cookieName: "gb_customer_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
  },
};

export async function getCustomerSession() {
  const cookieStore = await cookies();
  return getIronSession<CustomerSessionData>(
    cookieStore,
    customerSessionOptions
  );
}
