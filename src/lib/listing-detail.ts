import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { boostMessages, listings } from "@/db/schema";
import { resolveLinkMetadata } from "@/lib/link-metadata";

const OG_STALE_MS = 7 * 24 * 60 * 60 * 1000;

async function maybeRefreshOg(listing: typeof listings.$inferSelect) {
  const stale =
    !listing.ogFetchedAt ||
    Date.now() - listing.ogFetchedAt.getTime() > OG_STALE_MS;
  const missing = !listing.ogImageUrl && !listing.ogDescription;

  if (!stale && !missing) return listing;

  try {
    const meta = await resolveLinkMetadata(listing.url);
    const [updated] = await db
      .update(listings)
      .set({
        ogImageUrl: meta.ogImageUrl || listing.ogImageUrl,
        ogDescription: meta.ogDescription || listing.ogDescription,
        faviconUrl: listing.faviconUrl || meta.faviconUrl,
        ogFetchedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(listings.id, listing.id))
      .returning();
    return updated ?? listing;
  } catch {
    return listing;
  }
}

async function rankForListing(id: string) {
  const rows = await db
    .select({ id: listings.id })
    .from(listings)
    .orderBy(desc(listings.bid), desc(listings.clicks));

  for (let i = 0; i < rows.length; i++) {
    if (rows[i]!.id === id) return i + 1;
  }
  return null;
}

export async function getListingDetail(id: string) {
  const [listing] = await db
    .select()
    .from(listings)
    .where(eq(listings.id, id))
    .limit(1);

  if (!listing) return null;

  const fresh = await maybeRefreshOg(listing);

  const messages = await db
    .select()
    .from(boostMessages)
    .where(eq(boostMessages.listingId, id))
    .orderBy(desc(boostMessages.createdAt));

  const rank = await rankForListing(id);

  return { listing: fresh, messages, rank };
}
