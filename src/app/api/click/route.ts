/**
 * GET /api/click?id=LISTING_ID — legacy direct redirect (counts as visit)
 * POST /api/click { id, action: "click" | "visit" } — dialog tracking
 */
import { eq, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { trackClickSchema } from "@/lib/validations";

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

    await db
      .update(listings)
      .set({
        visits: sql`${listings.visits} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id));

    return NextResponse.redirect(listing.url, { status: 302 });
  } catch (error) {
    console.error("[click]", error);
    return NextResponse.redirect(new URL("/", request.url));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = trackClickSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const { id, action } = parsed.data;

    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const [updated] = await db
      .update(listings)
      .set(
        action === "visit"
          ? {
              visits: sql`${listings.visits} + 1`,
              updatedAt: new Date(),
            }
          : {
              clicks: sql`${listings.clicks} + 1`,
              updatedAt: new Date(),
            }
      )
      .where(eq(listings.id, id))
      .returning();

    return NextResponse.json({
      url: listing.url,
      clicks: updated?.clicks ?? listing.clicks,
      visits: updated?.visits ?? listing.visits,
    });
  } catch (error) {
    console.error("[click]", error);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
