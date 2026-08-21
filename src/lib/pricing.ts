/**
 * Gamified pricing for rank.fish
 *
 * Levels 1–100 map onto a dollar range that scales with board activity:
 *   1–10  effective links → $1–$100
 *  11–20  effective links → $2–$200
 *  21–30  effective links → $3–$300
 *  …
 *
 * Effective links = real listings + floor(totalClicks / CLICKS_PER_SLOT).
 * Clicks raise the rate as traffic grows — early adopters keep the cheap band.
 */

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 100;
/** Every N community clicks counts as one extra “slot” toward the next price tier */
export const CLICKS_PER_SLOT = 100;
const BASE_MIN_DOLLARS = 1;
const BASE_MAX_DOLLARS = 100;

export type EconomySnapshot = {
  listingCount: number;
  totalClicks: number;
  clickSlots: number;
  effectiveCount: number;
  /** Current board tier (what boosts use) */
  tier: number;
  /** Tier a brand-new listing would enter (counts the new slot) */
  createTier: number;
  minCents: number;
  maxCents: number;
  createMinCents: number;
  createMaxCents: number;
  nextTierAt: number;
  clicksToNextSlot: number;
};

export function tierFromCount(effectiveCount: number): number {
  return Math.max(1, Math.ceil(Math.max(effectiveCount, 1) / 10));
}

export function rangeForTier(tier: number): { minCents: number; maxCents: number } {
  const t = Math.max(1, Math.floor(tier));
  return {
    minCents: t * BASE_MIN_DOLLARS * 100,
    maxCents: t * BASE_MAX_DOLLARS * 100,
  };
}

export function buildEconomy(
  listingCount: number,
  totalClicks: number
): EconomySnapshot {
  const clickSlots = Math.floor(Math.max(0, totalClicks) / CLICKS_PER_SLOT);
  const effectiveCount = Math.max(0, listingCount) + clickSlots;
  const tier = tierFromCount(effectiveCount);
  const createTier = tierFromCount(effectiveCount + 1);
  const { minCents, maxCents } = rangeForTier(tier);
  const createRange = rangeForTier(createTier);
  const nextTierAt = tier * 10 + 1;
  const clicksIntoSlot = Math.max(0, totalClicks) % CLICKS_PER_SLOT;

  return {
    listingCount,
    totalClicks,
    clickSlots,
    effectiveCount,
    tier,
    createTier,
    minCents,
    maxCents,
    createMinCents: createRange.minCents,
    createMaxCents: createRange.maxCents,
    nextTierAt,
    clicksToNextSlot: CLICKS_PER_SLOT - clicksIntoSlot,
  };
}

/** Map level 1–100 → bid cents within a tier range (inclusive). */
export function levelToCents(
  level: number,
  minCents: number,
  maxCents: number
): number {
  const lv = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, Math.round(level)));
  const span = MAX_LEVEL - MIN_LEVEL;
  if (span <= 0) return minCents;
  const t = (lv - MIN_LEVEL) / span;
  return Math.round(minCents + t * (maxCents - minCents));
}

/** Nearest level for a bid within a range. */
export function centsToLevel(
  cents: number,
  minCents: number,
  maxCents: number
): number {
  if (maxCents <= minCents) return MIN_LEVEL;
  const t = (cents - minCents) / (maxCents - minCents);
  return Math.min(
    MAX_LEVEL,
    Math.max(MIN_LEVEL, Math.round(t * (MAX_LEVEL - MIN_LEVEL) + MIN_LEVEL))
  );
}

/** Lowest level whose price is strictly above `currentBid` (for boosts). */
export function minBoostLevel(
  currentBid: number,
  minCents: number,
  maxCents: number
): number {
  for (let lv = MIN_LEVEL; lv <= MAX_LEVEL; lv++) {
    if (levelToCents(lv, minCents, maxCents) > currentBid) return lv;
  }
  return MAX_LEVEL;
}
