/**
 * Best-effort favicon discovery for a listing URL.
 * Returns an absolute image URL, or "" when nothing usable is found.
 * Never invents a generic globe icon — empty means “no icon in the badge”.
 */

const FETCH_MS = 4_000;

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
      // Reject tiny / empty bodies (broken placeholders)
      const buf = await res.arrayBuffer();
      return buf.byteLength >= 64;
    }
    // Some hosts omit content-type but still serve ico bytes
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
  const re =
    /<link\b[^>]*rel=["'][^"']*icon[^"']*["'][^>]*>/gi;
  const hrefRe = /href=["']([^"']+)["']/i;
  for (const tag of html.match(re) ?? []) {
    const m = tag.match(hrefRe);
    if (m?.[1]) hrefs.push(m[1]);
  }
  return hrefs;
}

export async function resolveFavicon(pageUrl: string): Promise<string> {
  let origin: string;
  try {
    origin = new URL(pageUrl).origin;
  } catch {
    return "";
  }

  const candidates: string[] = [];

  try {
    const res = await fetch(pageUrl, {
      method: "GET",
      redirect: "follow",
      signal: withTimeout(FETCH_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "rank.fish-favicon-bot/1.0",
      },
    });
    if (res.ok) {
      const html = (await res.text()).slice(0, 80_000);
      for (const href of extractIconHrefs(html)) {
        const abs = absolutize(href, res.url || pageUrl);
        if (abs) candidates.push(abs);
      }
    }
  } catch {
    // fall through to /favicon.ico
  }

  candidates.push(`${origin}/favicon.ico`);
  candidates.push(`${origin}/favicon.png`);

  const seen = new Set<string>();
  for (const url of candidates) {
    if (seen.has(url)) continue;
    seen.add(url);
    if (await looksLikeImage(url)) return url;
  }

  return "";
}
