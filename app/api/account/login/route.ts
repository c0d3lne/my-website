import { NextRequest, NextResponse } from "next/server";
import { customerLoginSchema } from "@/lib/validators";
import { getCustomerByEmail, getPasswordHash } from "@/lib/customers";
import { verifyPassword } from "@/lib/hash";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = customerLoginSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid details" }, { status: 400 });
    }

    const customer = getCustomerByEmail(parsed.data.email);
    const hash = getPasswordHash(parsed.data.email);
    if (!customer || !hash || !verifyPassword(parsed.data.password, hash)) {
      return NextResponse.json(
        { error: "Incorrect email or password." },
        { status: 401 }
      );
    }

    const session = await getCustomerSession();
    session.customerId = customer.id;
    session.email = customer.email;
    await session.save();

    return NextResponse.json({ id: customer.id, email: customer.email });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
