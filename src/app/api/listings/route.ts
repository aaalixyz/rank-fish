/**
 * GET /api/listings
 * Returns all listings sorted by bid (highest first).
 * Useful for client refresh / future polling.
 */
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.bid), desc(listings.updatedAt));

    return NextResponse.json({ listings: rows });
  } catch (error) {
    console.error("[listings]", error);
    return NextResponse.json(
      { error: "Failed to load listings" },
      { status: 500 }
    );
  }
}
