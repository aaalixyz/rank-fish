/**
 * GET /api/listings/[id]
 * Full listing for the preview dialog: OG fields, support history, rank.
 */
import { NextResponse } from "next/server";
import { getListingDetail } from "@/lib/listing-detail";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;
    const detail = await getListingDetail(id);

    if (!detail) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    return NextResponse.json(detail);
  } catch (error) {
    console.error("[listings/id]", error);
    return NextResponse.json(
      { error: "Failed to load listing" },
      { status: 500 }
    );
  }
}
