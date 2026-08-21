import { desc } from "drizzle-orm";
import { HomePage } from "@/components/home-page";
import { db } from "@/db";
import { listings } from "@/db/schema";

export const dynamic = "force-dynamic";

async function getListings() {
  try {
    return await db
      .select()
      .from(listings)
      .orderBy(desc(listings.bid), desc(listings.updatedAt));
  } catch (error) {
    // During first deploy (before tables exist / env missing), show empty board
    console.error("[home] failed to load listings", error);
    return [];
  }
}

export default async function Page() {
  const rows = await getListings();
  return <HomePage listings={rows} />;
}
