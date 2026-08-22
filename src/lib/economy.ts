import { sql } from "drizzle-orm";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { buildEconomy, type EconomySnapshot } from "@/lib/pricing";

export async function getEconomySnapshot(): Promise<EconomySnapshot> {
  try {
    const [row] = await db
      .select({
        listingCount: sql<number>`count(*)::int`,
        totalClicks: sql<number>`coalesce(sum(${listings.clicks} + ${listings.visits}), 0)::int`,
      })
      .from(listings);

    return buildEconomy(row?.listingCount ?? 0, row?.totalClicks ?? 0);
  } catch (error) {
    console.error("[economy]", error);
    return buildEconomy(0, 0);
  }
}
