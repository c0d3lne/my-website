import { NextRequest, NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators";
import { createCustomer, getCustomerByEmail } from "@/lib/customers";
import { getCustomerSession } from "@/lib/customer-auth";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid details" },
        { status: 400 }
      );
    }

    if (getCustomerByEmail(parsed.data.email)) {
      return NextResponse.json(
        { error: "An account with that email already exists. Try signing in." },
        { status: 409 }
      );
    }

    const customer = createCustomer(parsed.data);

    const session = await getCustomerSession();
    session.customerId = customer.id;
    session.email = customer.email;
    await session.save();

    return NextResponse.json(
      { id: customer.id, email: customer.email, referralCode: customer.referralCode },
      { status: 201 }
    );
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
