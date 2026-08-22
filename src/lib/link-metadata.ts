/**
 * Best-effort link metadata for listings: favicon + Open Graph preview.
 * One HTML fetch when possible; falls back to /favicon.ico probes.
 */

const FETCH_MS = 4_500;
const HTML_SLICE = 120_000;

export type LinkMetadata = {
  faviconUrl: string;
  ogImageUrl: string;
  ogDescription: string;
};

function withTimeout(ms: number): AbortSignal {
  const ctrl = new AbortController();
  setTimeout(() => ctrl.abort(), ms);
  return ctrl.signal;
}

function absolutize(href: string, base: string): string | null {
  try {
    return new URL(href, base).href;
  } catch {
    return null;
  }
}

async function looksLikeImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: withTimeout(FETCH_MS),
      headers: { Accept: "image/*,*/*;q=0.8" },
    });
    if (!res.ok) return false;
    const type = res.headers.get("content-type") ?? "";
    if (type.startsWith("image/")) {
      const buf = await res.arrayBuffer();
      return buf.byteLength >= 64;
    }
    if (!type || type.includes("octet-stream")) {
      const buf = await res.arrayBuffer();
      return buf.byteLength >= 64;
    }
    return false;
  } catch {
    return false;
  }
}

function extractIconHrefs(html: string): string[] {
  const hrefs: string[] = [];
  const re = /<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  for (const tag of html.match(re) ?? []) {
    const m = tag.match(hrefRe);
    if (m?.[1]) hrefs.push(m[1]);
  }
  return hrefs;
}

function metaContent(html: string, property: string): string {
  const patterns = [
    new RegExp(
      `<meta\\b[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
      "i"
    ),
    new RegExp(
      `<meta\\b[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].trim();
  }
  return "";
}

function trimDescription(text: string): string {
  const collapsed = text.replace(/\s+/g, " ").trim();
  return collapsed.slice(0, 280);
}

async function resolveFaviconFromCandidates(
  candidates: string[],
  origin: string
): Promise<string> {
  const queue = [...candidates, `${origin}/favicon.ico`, `${origin}/favicon.png`];
  const seen = new Set<string>();
  for (const url of queue) {
    if (seen.has(url)) continue;
    seen.add(url);
    if (await looksLikeImage(url)) return url;
  }
  return "";
}

export async function resolveLinkMetadata(pageUrl: string): Promise<LinkMetadata> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return { faviconUrl: "", ogImageUrl: "", ogDescription: "" };
  }

  const iconCandidates: string[] = [];
  let ogImageUrl = "";
  let ogDescription = "";

  try {
    const res = await fetch(pageUrl, {
      method: "GET",
      redirect: "follow",
      signal: withTimeout(FETCH_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "rank.fish-link-bot/1.0",
      },
    });

    if (res.ok) {
      const html = (await res.text()).slice(0, HTML_SLICE);
      const base = res.url || pageUrl;

      for (const href of extractIconHrefs(html)) {
        const abs = absolutize(href, base);
        if (abs) iconCandidates.push(abs);
      }

      const ogImageRaw =
        metaContent(html, "og:image") ||
        metaContent(html, "twitter:image") ||
        metaContent(html, "twitter:image:src");
      const ogImageAbs = ogImageRaw ? absolutize(ogImageRaw, base) : null;
      if (ogImageAbs) ogImageUrl = ogImageAbs;

      const descRaw =
        metaContent(html, "og:description") ||
        metaContent(html, "description") ||
        metaContent(html, "twitter:description");
      ogDescription = trimDescription(descRaw);
    }
  } catch {
    // fall through to favicon-only probes
  }

  const faviconUrl = await resolveFaviconFromCandidates(iconCandidates, origin);

  return { faviconUrl, ogImageUrl, ogDescription };
}
