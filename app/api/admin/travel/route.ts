import { NextRequest, NextResponse } from "next/server";
import { createTravelAreaSchema } from "@/lib/validators";
import { getAllTravelAreas, createTravelArea, defaultTravelCharge } from "@/lib/travel";
import { getSettingNumber, getSetting } from "@/lib/settings";

export async function GET() {
  return NextResponse.json({
    areas: getAllTravelAreas(),
    settings: {
      default_travel_charge: defaultTravelCharge(),
      referral_threshold: getSettingNumber("referral_threshold", 5),
      reward_label: getSetting("reward_label") ?? "One free exterior wash",
    },
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createTravelAreaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Validation failed" },
        { status: 400 }
      );
    }
    return NextResponse.json(createTravelArea(parsed.data), { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
