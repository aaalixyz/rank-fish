/**
 * Internal debug board — 50 handmade listings with seeded “random”
 * bids, clicks, themes, and boost notes. Client-only; never written
 * to the database.
 */
import type { BoostMessage, Listing } from "@/db/schema";
import { PILL_THEME_IDS } from "@/lib/pill-themes";
import { buildEconomy, levelToCents, type EconomySnapshot } from "@/lib/pricing";

export const DEMO_LISTING_COUNT = 50;
export const DEMO_STORAGE_KEY = "rankfish:demo:v1";
export const DEMO_LOGO_CLICK_KEY = "rankfish:demo-logo-click:v1";
/** Two logo clicks within this window toggles demo mode. */
export const DEMO_LOGO_CLICK_MS = 1000;

export type DemoListing = Listing & { messages: BoostMessage[] };

type Seed = {
  title: string;
  url: string;
  description: string;
  /** Skip favicon so we can debug the no-icon pill. */
  noIcon?: boolean;
};

const SEEDS: Seed[] = [
  { title: "Northwind Labs", url: "https://northwindlabs.dev", description: "Quiet tools for loud teams." },
  { title: "Paper Tide", url: "https://papertide.com", description: "Editorial layout, printed in the browser." },
  { title: "Kelp Radio", url: "https://kelpradio.fm", description: "Late-night transmissions from the kelp forest." },
  { title: "Sable Type", url: "https://sabletype.co", description: "A type foundry that only ships at dusk." },
  { title: "Drift Atlas", url: "https://driftatlas.org", description: "Maps of places that move." },
  { title: "Copper Thread", url: "https://copperthread.io", description: "Stitch APIs together without the mess." },
  { title: "Low Orbit Notes", url: "https://loworbit.notes", description: "A notebook that forgets on purpose.", noIcon: true },
  { title: "Moth Hour", url: "https://mothhour.com", description: "Poetry that only publishes after midnight." },
  { title: "Glass Orchard", url: "https://glassorchard.shop", description: "Fruit bowls, blown not grown." },
  { title: "Second Harbor", url: "https://secondharbor.net", description: "A second home for half-finished ships." },
  { title: "Brine Index", url: "https://brineindex.com", description: "Salinity as a service." },
  { title: "Folded Maps Co", url: "https://foldedmaps.co", description: "Paper maps for people who get lost on purpose." },
  { title: "Quiet Voltage", url: "https://quietvoltage.xyz", description: "Small electronics, no blinking lights." },
  { title: "Aster Field", url: "https://asterfield.garden", description: "Wildflowers, scheduled like cron." },
  { title: "Redshift Press", url: "https://redshift.press", description: "Chapbooks that recede as you read." },
  { title: "Harborless", url: "https://harborless.com", description: "Logistics for things that should not dock.", noIcon: true },
  { title: "Lumen Grain", url: "https://lumengrain.photo", description: "Film stock that remembers the light." },
  { title: "Soft Ledger", url: "https://softledger.app", description: "Books that forgive rounding errors." },
  { title: "Iron Pollen", url: "https://ironpollen.studio", description: "Brutalist bees, gentle honey." },
  { title: "Nimbus Index", url: "https://nimbusindex.cloud", description: "A catalog of every named cloud." },
  { title: "Velvet Circuit", url: "https://velvetcircuit.net", description: "Hardware wrapped in cloth." },
  { title: "Cinder Mail", url: "https://cinder.mail", description: "Email that burns after a week." },
  { title: "Pebble Clock", url: "https://pebbleclock.com", description: "Time, but only in stones.", noIcon: true },
  { title: "Arc Lamp Society", url: "https://arclampsociety.org", description: "Members who prefer harsh light." },
  { title: "Tidal Syntax", url: "https://tidalsyntax.dev", description: "A language that ebbs." },
  { title: "Moss Modem", url: "https://mossmodem.io", description: "Slow internet for slow rooms." },
  { title: "Ivory Switch", url: "https://ivoryswitch.com", description: "One button. That is the product." },
  { title: "Farthing News", url: "https://farthing.news", description: "A paper that costs a farthing and takes all day." },
  { title: "Cobalt Thread", url: "https://cobalthread.work", description: "Workwear dyed like deep water." },
  { title: "Echo Quarry", url: "https://echoquarry.audio", description: "Field recordings from empty pits." },
  { title: "Wren Protocol", url: "https://wrenprotocol.org", description: "Birds as packets.", noIcon: true },
  { title: "Salt Gallery", url: "https://saltgallery.art", description: "Exhibits that dissolve in humidity." },
  { title: "Plainspoken", url: "https://plainspoken.write", description: "A writing app that deletes adverbs." },
  { title: "Hearth Kernel", url: "https://hearthkernel.org", description: "An OS that boots like a stove." },
  { title: "Larkspur Bids", url: "https://larkspurbids.com", description: "Auctions for things nobody priced." },
  { title: "Nocturne CSV", url: "https://nocturne.csv", description: "Spreadsheets that only open at night." },
  { title: "Marigold Bus", url: "https://marigoldbus.city", description: "A bus line painted like a flower." },
  { title: "Thin Ice Hosting", url: "https://thinice.host", description: "Servers on a lake. In winter." },
  { title: "Pinafore Club", url: "https://pinafore.club", description: "Uniforms optional, manners not.", noIcon: true },
  { title: "Gilt Margin", url: "https://giltmargin.books", description: "Margins you can actually write in." },
  { title: "River Fork API", url: "https://riverfork.api", description: "Split traffic like a stream." },
  { title: "Smoke Signal CMS", url: "https://smokesignal.cms", description: "Publish by waving a blanket." },
  { title: "Walnut Kernel", url: "https://walnutkernel.food", description: "Recipes that crack open slowly." },
  { title: "Dusk Router", url: "https://duskrouter.net", description: "Packets that prefer the evening." },
  { title: "Felt Archive", url: "https://feltarchive.org", description: "Soft copies of hard history." },
  { title: "Bramble Pay", url: "https://bramblepay.com", description: "Payments with thorns." },
  { title: "Oat Milk Orbit", url: "https://oatmilkorbit.space", description: "Dairy-free satellite snacks.", noIcon: true },
  { title: "Chalk Index", url: "https://chalkindex.edu", description: "Blackboard search, finally." },
  { title: "Slate Harbor Press", url: "https://slateharbor.press", description: "News that fits on one stone." },
  { title: "Rank Fish Demo", url: "https://rank.fish", description: "You are looking at the debug board." },
];

const NOTES = [
  "This one still makes me smile.",
  "Boosted because the field felt empty without it.",
  "Tiny, stubborn, perfect.",
  "Putting this back on top for a day.",
  "The pill color did it.",
  "Came back to raise the floor.",
  "Quiet work. Loud support.",
  "For the late-night crowd.",
  "Deserves to drift slower.",
  "A little fuel. Keep going.",
];

const HANDLES = [
  "kelpwalker",
  "paperbound",
  "loworbit",
  "saltlight",
  "duskrouter",
  "foldmaps",
  "quietvolt",
  "brineindex",
  "secondharbor",
  "giltmargin",
  "",
  "",
];

/** Mulberry32 — tiny seeded RNG so the board is stable across reloads. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, list: readonly T[]): T {
  return list[Math.floor(rng() * list.length)] as T;
}

function faviconFor(url: string): string {
  try {
    const host = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=64`;
  } catch {
    return "";
  }
}

function demoId(n: number): string {
  return `00000000-0000-4000-8000-${n.toString(16).padStart(12, "0")}`;
}

function buildDemoBoard(): { listings: DemoListing[]; economy: EconomySnapshot } {
  if (SEEDS.length !== DEMO_LISTING_COUNT) {
    throw new Error(
      `demo board expected ${DEMO_LISTING_COUNT} seeds, got ${SEEDS.length}`
    );
  }

  const rng = mulberry32(0x72616e6b); // "rank"
  const origin = Date.UTC(2026, 4, 12, 16, 40, 0);

  const levels = SEEDS.map((_, i) => {
    if (i === 0) return 97;
    if (i === 1) return 91;
    if (i === 2) return 84;
    if (i === 3) return 76;
    // Power-law: lots of small pills, a few mid-field.
    return Math.max(1, Math.min(100, Math.round(1 + rng() ** 2.15 * 62)));
  });

  const clicks = SEEDS.map(() => {
    const roll = rng();
    if (roll > 0.92) return 80 + Math.floor(rng() * 220);
    if (roll > 0.6) return 12 + Math.floor(rng() * 70);
    return Math.floor(rng() * 18);
  });

  const totalClicks = clicks.reduce((sum, n) => sum + n, 0);
  const economy = buildEconomy(DEMO_LISTING_COUNT, totalClicks);

  const listings: DemoListing[] = SEEDS.map((seed, i) => {
    const createdAt = new Date(origin - i * 36e5 * (6 + rng() * 18));
    const updatedAt = new Date(createdAt.getTime() + rng() * 8 * 864e5);
    const level = levels[i]!;
    const jitter = rng() < 0.22 ? 0.82 + rng() * 0.12 : 1;
    const bid = Math.max(
      economy.minCents,
      Math.round(
        levelToCents(level, economy.minCents, economy.maxCents) * jitter
      )
    );
    const id = demoId(i + 1);
    const messageCount =
      rng() > 0.62 ? 0 : rng() > 0.82 ? 3 : rng() > 0.5 ? 2 : 1;

    const messages: BoostMessage[] = Array.from(
      { length: messageCount },
      (_, m) => {
        const amountPaid = Math.round(
          economy.minCents * (0.4 + rng() * 1.8)
        );
        return {
          id: demoId(1000 + i * 10 + m),
          listingId: id,
          paymentId: null,
          message: pick(rng, NOTES),
          xHandle: pick(rng, HANDLES),
          amountPaid,
          createdAt: new Date(updatedAt.getTime() - m * 36e5 * 9),
        };
      }
    );

    return {
      id,
      url: seed.url,
      title: seed.title,
      description: seed.description,
      faviconUrl: seed.noIcon ? "" : faviconFor(seed.url),
      bid,
      level,
      theme: PILL_THEME_IDS[i % PILL_THEME_IDS.length]!,
      clicks: clicks[i]!,
      createdAt,
      updatedAt,
      messages,
    };
  });

  listings.sort((a, b) => b.bid - a.bid || b.clicks - a.clicks);
  return { listings, economy };
}

const BOARD = buildDemoBoard();

export const DEMO_LISTINGS: DemoListing[] = BOARD.listings;
export const DEMO_ECONOMY: EconomySnapshot = BOARD.economy;

export function listingHref(listing: Pick<Listing, "id" | "url">, demo: boolean) {
  if (demo) return listing.url;
  return `/api/click?id=${listing.id}`;
}
