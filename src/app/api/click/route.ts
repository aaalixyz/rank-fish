/**
 * GET /api/click?id=LISTING_ID
 *
 * Counts a click, then sends the visitor to the listing URL.
 * Badges and leaderboard rows link here instead of straight to the site.
 */
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Increment click count (fire-and-forget style — still awaited for accuracy)
    await db
      .update(listings)
      .set({
        clicks: sql`${listings.clicks} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    return NextResponse.redirect(listing.url, { status: 302 });
  } catch (error) {
    console.error("[click]", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}
