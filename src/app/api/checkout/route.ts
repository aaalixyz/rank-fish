/**
 * POST /api/checkout
 *
 * Starts a Polar payment for either:
 *  - creating a new listing, or
 *  - boosting an existing one (user only pays the difference)
 */
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { listings, payments } from "@/db/schema";
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

    if (data.type === "create") {
      // Prevent exact-duplicate URLs from stacking silently — boost instead
      const [existing] = await db
        .select()
        .from(listings)
        .where(eq(listings.url, data.url))
        .limit(1);

      if (existing) {
        return NextResponse.json(
          {
            error:
              "This URL is already on the board. Use Boost to raise its bid.",
            listingId: existing.id,
          },
          { status: 409 }
        );
      }

      const amountPaid = data.bid;

      const [payment] = await db
        .insert(payments)
        .values({
          // Temporary id until Polar returns a checkout id
          polarCheckoutId: `pending_${crypto.randomUUID()}`,
          type: "create",
          url: data.url,
          title: data.title,
          description: data.description ?? "",
          targetBid: data.bid,
          amountPaid,
          status: "pending",
        })
        .returning();

      const checkout = await createPolarCheckout({
        amountCents: amountPaid,
        productNameHint: data.title,
        metadata: {
          paymentId: payment.id,
          type: "create",
          targetBid: String(data.bid),
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

    // Boost flow
    const [listing] = await db
      .select()
      .from(listings)
      .where(eq(listings.id, data.listingId))
      .limit(1);

    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    if (data.bid <= listing.bid) {
      return NextResponse.json(
        {
          error: `New bid must be higher than the current bid of $${(listing.bid / 100).toFixed(2)}`,
        },
        { status: 400 }
      );
    }

    // User only pays the difference between current and new bid
    const amountPaid = data.bid - listing.bid;

    const [payment] = await db
      .insert(payments)
      .values({
        polarCheckoutId: `pending_${crypto.randomUUID()}`,
        type: "boost",
        listingId: listing.id,
        url: listing.url,
        title: listing.title,
        description: listing.description,
        targetBid: data.bid,
        amountPaid,
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
        targetBid: String(data.bid),
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
