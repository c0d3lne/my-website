import { NextRequest, NextResponse } from "next/server";
import { settingsSchema } from "@/lib/validators";
import { setSetting } from "@/lib/settings";

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
    }
    const { default_travel_charge, referral_threshold, reward_label } = parsed.data;
    if (default_travel_charge !== undefined)
      setSetting("default_travel_charge", String(default_travel_charge));
    if (referral_threshold !== undefined)
      setSetting("referral_threshold", String(referral_threshold));
    if (reward_label !== undefined) setSetting("reward_label", reward_label);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
