import { NextResponse } from "next/server";
import { getAllCustomers } from "@/lib/customers";
import { getReferralProgress } from "@/lib/referrals";

export async function GET() {
  const customers = getAllCustomers().map((c) => ({
    ...c,
    referral: getReferralProgress(c.email),
  }));
  return NextResponse.json(customers);
}
