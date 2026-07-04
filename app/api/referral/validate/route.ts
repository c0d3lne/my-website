import { NextRequest, NextResponse } from "next/server";
import { getCustomerByReferralCode } from "@/lib/customers";

// Public: checks whether a code is a real customer referral code. Returns only
// the normalised code (no personal details) so the booking form can accept it.
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();
  if (!code) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }
  const referrer = getCustomerByReferralCode(code);
  if (!referrer) {
    return NextResponse.json({ error: "invalid" }, { status: 404 });
  }
  return NextResponse.json({ code: referrer.referralCode });
}
