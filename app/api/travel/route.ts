import { NextRequest, NextResponse } from "next/server";
import { getAllTravelAreas, defaultTravelCharge, resolveTravelCharge } from "@/lib/travel";

// Public. With ?location=... returns the resolved travel charge for that place;
// otherwise returns the configured areas + default so the form can show them.
export async function GET(req: NextRequest) {
  const location = req.nextUrl.searchParams.get("location");
  if (location !== null) {
    return NextResponse.json(resolveTravelCharge(location));
  }

  const areas = getAllTravelAreas().map((a) => ({
    name: a.name,
    postcodePrefix: a.postcodePrefix,
    charge: a.charge,
  }));
  return NextResponse.json({ areas, defaultCharge: defaultTravelCharge() });
}
