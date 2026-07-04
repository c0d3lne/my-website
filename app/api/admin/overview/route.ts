import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getAllInvoices } from "@/lib/invoices";
import { getRewardEligibleCustomers } from "@/lib/referrals";
import { getCustomerByEmail } from "@/lib/customers";

export async function GET() {
  const db = getDb();

  const bookingRows = db
    .prepare("SELECT status, COUNT(*) AS n FROM bookings GROUP BY status")
    .all() as Array<{ status: string; n: number }>;
  const bookingCounts: Record<string, number> = {
    pending: 0,
    confirmed: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const r of bookingRows) bookingCounts[r.status] = r.n;
  const totalBookings = Object.values(bookingCounts).reduce((a, b) => a + b, 0);

  const invoices = getAllInvoices();
  const unpaid = invoices.filter((i) => i.status !== "paid");
  const overdue = invoices.filter((i) => i.status === "overdue");
  const outstanding = unpaid.reduce((a, i) => a + i.amount, 0);

  const customers = (
    db.prepare("SELECT COUNT(*) AS n FROM customers").get() as { n: number }
  ).n;

  // Referral reward notification — who has earned a free wash.
  const rewardEligible = getRewardEligibleCustomers().map((r) => {
    const c = getCustomerByEmail(r.email);
    return {
      email: r.email,
      name: c?.name ?? null,
      referralCode: c?.referralCode ?? null,
      successful: r.successful,
    };
  });

  return NextResponse.json({
    bookingCounts,
    totalBookings,
    invoices: {
      total: invoices.length,
      unpaid: unpaid.length,
      overdue: overdue.length,
      outstanding,
    },
    customers,
    rewardEligible,
  });
}
