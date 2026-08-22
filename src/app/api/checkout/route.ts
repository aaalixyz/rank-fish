/**
 * POST /api/checkout
 *
 * Starts a Polar payment for either:
 *  - creating a new listing, or
 *  - boosting an existing one (user only pays the difference)
 *
 * Bid amounts come from the gamified level slider (server re-prices from economy).
 */
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, payments } from "@/db/schema";
import { getEconomySnapshot } from "@/lib/economy";
import { resolveFavicon } from "@/lib/favicon";
import {
  levelToCents,
  minBoostLevel,
} from "@/lib/pricing";
import { createPolarCheckout } from "@/lib/polar";
import { checkoutRequestSchema } from "@/lib/validations";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = checkoutRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid request" },
        { status: 400 }
      );
    }

    const data = parsed.data;
    const economy = await getEconomySnapshot();

    if (data.type === "create") {
      const [existing] = await db
        .select()
        .from(listings)
        .where(eq(listings.url, data.url))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          {
            error:
              "This URL is already on the board. Use Boost on Rank to raise it — you only pay the difference.",
            listingId: existing.id,
          },
          { status: 409 }
        );
      }

      const bid = levelToCents(
        data.level,
        economy.createMinCents,
        economy.createMaxCents
      );
      const faviconUrl = await resolveFavicon(data.url);

      const [payment] = await db
        .insert(payments)
        .values({
          polarCheckoutId: `pending_${crypto.randomUUID()}`,
          type: "create",
          url: data.url,
          title: data.title,
          description: "",
          faviconUrl,
          level: data.level,
          theme: data.theme,
          xHandle: data.xHandle ?? "",
          targetBid: bid,
          amountPaid: bid,
          status: "pending",
        })
        .returning();

      const checkout = await createPolarCheckout({
        amountCents: bid,
        productNameHint: data.title,
        metadata: {
          paymentId: payment.id,
          type: "create",
          targetBid: String(bid),
        },
      });

      await db
        .update(payments)
        .set({
          polarCheckoutId: checkout.id,
          updatedAt: new Date(),
        })
        .where(eq(payments.id, payment.id));

      return NextResponse.json({
        checkoutUrl: checkout.url,
        checkoutId: checkout.id,
      });
    }

    // Boost
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, data.listingId))
      .limit(1);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const floorLevel = minBoostLevel(
      listing.bid,
      economy.minCents,
      economy.maxCents
    );
    if (data.level < floorLevel) {
      return NextResponse.json(
        {
          error: `Pick a level above the current bid (Lv ${floorLevel}+). You only pay the difference.`,
        },
        { status: 400 }
      );
    }

    const bid = levelToCents(data.level, economy.minCents, economy.maxCents);
    if (bid <= listing.bid) {
      return NextResponse.json(
        {
          error: `New bid must be higher than the current $${(listing.bid / 100).toFixed(2)}. Boost anytime — you only pay the difference.`,
        },
        { status: 400 }
      );
    }

    const amountPaid = bid - listing.bid;

    const [payment] = await db
      .insert(payments)
      .values({
        polarCheckoutId: `pending_${crypto.randomUUID()}`,
        type: "boost",
        listingId: listing.id,
        url: listing.url,
        title: listing.title,
        description: listing.description,
        faviconUrl: listing.faviconUrl ?? "",
        level: data.level,
        targetBid: bid,
        amountPaid,
        message: data.message ?? "",
        xHandle: data.xHandle ?? "",
        theme: data.theme,
        status: "pending",
      })
      .returning();

    const checkout = await createPolarCheckout({
      amountCents: amountPaid,
      productNameHint: `Boost: ${listing.title}`,
      metadata: {
        paymentId: payment.id,
        type: "boost",
        listingId: listing.id,
        targetBid: String(bid),
      },
    });

    await db
      .update(payments)
      .set({
        polarCheckoutId: checkout.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    return NextResponse.json({
      checkoutUrl: checkout.url,
      checkoutId: checkout.id,
      amountPaid,
    });
  } catch (error) {
    console.error("[checkout]", error);
    const message =
      error instanceof Error ? error.message : "Failed to start checkout";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
