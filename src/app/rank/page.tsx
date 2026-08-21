import { desc, inArray } from "drizzle-orm";
import { RankPage } from "@/components/rank-page";
import { db } from "@/db";
import { boostMessages, listings } from "@/db/schema";
import type { ListingWithMessages } from "@/components/leaderboard";
import { getEconomySnapshot } from "@/lib/economy";

export const dynamic = "force-dynamic";

async function getRankedListings(): Promise<ListingWithMessages[]> {
  try {
    const rows = await db
      .select()
      .from(listings)
      .orderBy(desc(listings.bid), desc(listings.updatedAt));

    if (rows.length === 0) return [];

    const ids = rows.map((r) => r.id);
    const messages = await db
      .select()
      .from(boostMessages)
      .where(inArray(boostMessages.listingId, ids))
      .orderBy(desc(boostMessages.createdAt));

    const byListing = new Map<string, typeof messages>();
    for (const msg of messages) {
      const list = byListing.get(msg.listingId) ?? [];
      list.push(msg);
      byListing.set(msg.listingId, list);
    }

    return rows.map((row) => ({
      ...row,
      messages: byListing.get(row.id) ?? [],
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
