/**
 * Shared logic that turns a successful Polar payment into a listing update.
 * Called from the webhook (source of truth) and optionally from the success page.
 */
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { listings, payments } from "@/db/schema";

export async function fulfillPaymentByCheckoutId(checkoutId: string) {
  const [payment] = await db
    .select()
    .from(payments)
    .where(eq(payments.polarCheckoutId, checkoutId))
    .limit(1);

  if (!payment) {
    return { ok: false as const, reason: "payment_not_found" as const };
  }

  // Already processed — safe to call more than once
  if (payment.status === "completed") {
    return {
      ok: true as const,
      alreadyDone: true as const,
      listingId: payment.listingId,
    };
  }

  if (payment.type === "create") {
    const [listing] = await db
      .insert(listings)
      .values({
        url: payment.url,
        title: payment.title,
        description: payment.description,
        bid: payment.targetBid,
        clicks: 0,
      })
      .returning();

    await db
      .update(payments)
      .set({
        status: "completed",
        listingId: listing.id,
        updatedAt: new Date(),
      })
      .where(eq(payments.id, payment.id));

    return { ok: true as const, alreadyDone: false as const, listingId: listing.id };
  }

  // Boost an existing listing
  if (!payment.listingId) {
    return { ok: false as const, reason: "missing_listing" as const };
  }

  const [existing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, payment.listingId))
    .limit(1);

  if (!existing) {
    return { ok: false as const, reason: "listing_not_found" as const };
  }

  // Only raise the bid — never lower it if two checkouts race
  await db
    .update(listings)
    .set({
      bid: sql`GREATEST(${listings.bid}, ${payment.targetBid})`,
      updatedAt: new Date(),
    })
    .where(eq(listings.id, payment.listingId));

  await db
    .update(payments)
    .set({
      status: "completed",
      updatedAt: new Date(),
    })
    .where(eq(payments.id, payment.id));

  return {
    ok: true as const,
    alreadyDone: false as const,
    listingId: payment.listingId,
  };
}
