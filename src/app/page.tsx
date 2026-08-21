import { desc } from "drizzle-orm";
import { HomePage } from "@/components/home-page";
import { db } from "@/db";
import { listings } from "@/db/schema";
import { getEconomySnapshot } from "@/lib/economy";

export const dynamic = "force-dynamic";

async function getListings() {
  try {
    return await db
      .select()
      .from(listings)
      .orderBy(desc(listings.bid), desc(listings.updatedAt));
  } catch (error) {
    console.error("[home] failed to load listings", error);
    return [];
  }
}

export default async function Page() {
  const [rows, economy] = await Promise.all([
    getListings(),
    getEconomySnapshot(),
  ]);
  return <HomePage listings={rows} economy={economy} />;
}
