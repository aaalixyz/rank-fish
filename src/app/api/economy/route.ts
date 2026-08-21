import { NextResponse } from "next/server";
import { getEconomySnapshot } from "@/lib/economy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public economy snapshot for the level slider UI. */
export async function GET() {
  const economy = await getEconomySnapshot();
  return NextResponse.json(economy);
}
