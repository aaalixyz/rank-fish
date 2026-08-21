import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { RankPage } from "@/components/rank-page";
import { db } from "@/db";
import { boostMessages, listings, payments } from "@/db/schema";
import type { ListingWithMessages } from "@/components/leaderboard";
import { getEconomySnapshot } from "@/lib/economy";

export const dynamic = "force-dynamic";

async function getRankedListings(): Promise<ListingWithMessages[]> {
  try {
    const rows = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.level), desc(listings.updatedAt));

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const [messages, supporterRows] = await Promise.all([
      db
        .select()
        .from(boostMessages)
        .where(inArray(boostMessages.listingId, ids))
        .orderBy(desc(boostMessages.createdAt)),
      db
        .select({
          listingId: payments.listingId,
          count: sql<number>`count(*)::int`,
        })
        .from(payments)
        .where(
          and(
            inArray(payments.listingId, ids),
            eq(payments.status, "completed")
          )
        )
        .groupBy(payments.listingId),
    ]);

    const byListing = new Map<string, typeof messages>();
    for (const msg of messages) {
      const list = byListing.get(msg.listingId) ?? [];
      list.push(msg);
      byListing.set(msg.listingId, list);
    }

    const supportersByListing = new Map<string, number>();
    for (const row of supporterRows) {
      if (row.listingId) {
        supportersByListing.set(row.listingId, row.count);
      }
    }

    return rows.map((row) => ({
      ...row,
      messages: byListing.get(row.id) ?? [],
      // Completed payments (create + boosts) count as supporters
      supporters: supportersByListing.get(row.id) ?? 0,
    }));
  } catch (error) {
    console.error("[rank] failed to load listings", error);
    return [];
  }
}

export default async function RankRoute() {
  const [rows, economy] = await Promise.all([
    getRankedListings(),
    getEconomySnapshot(),
  ]);
  return <RankPage listings={rows} economy={economy} />;
}
