/**
 * Best-effort favicon discovery for a listing URL.
 * Delegates to link-metadata for a shared HTML fetch.
 */
import { resolveLinkMetadata } from "@/lib/link-metadata";

export async function resolveFavicon(pageUrl: string): Promise<string> {
  const meta = await resolveLinkMetadata(pageUrl);
  return meta.faviconUrl;
}
