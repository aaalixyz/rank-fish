/**
 * Helpers for turning a bid amount into visual size + opacity + drift speed.
 *
 * Bigger support → bigger, more solid, slower (more presence on the field).
 * Uses a log scale so one huge bid does not crush everyone else.
 */

export type BidVisual = {
  /** Pixel width for the drifting badge */
  size: number;
  /** 0–1 opacity */
  opacity: number;
  /** 0–1 normalized rank used for z-index / animation intensity */
  strength: number;
  /** Seconds for one full left→right loop */
  duration: number;
};

const MIN_SIZE = 72;
const MAX_SIZE = 220;
const MIN_OPACITY = 0.28;
const MAX_OPACITY = 1;
const MIN_DURATION = 18;
const MAX_DURATION = 48;

export function getBidVisual(
  bid: number,
  minBid: number,
  maxBid: number
): BidVisual {
  const safeBid = Math.max(bid, 1);
  const safeMin = Math.max(minBid, 1);
  const safeMax = Math.max(maxBid, safeMin);

  const logMin = Math.log(safeMin);
  const logMax = Math.log(safeMax);
  const logBid = Math.log(safeBid);

  const strength =
    logMax === logMin
      ? 1
      : Math.min(1, Math.max(0, (logBid - logMin) / (logMax - logMin)));

  return {
    size: Math.round(MIN_SIZE + strength * (MAX_SIZE - MIN_SIZE)),
    opacity: MIN_OPACITY + strength * (MAX_OPACITY - MIN_OPACITY),
    strength,
    duration: MAX_DURATION - strength * (MAX_DURATION - MIN_DURATION),
  };
}

/** Format cents as a dollar string, e.g. 1250 → "$12.50" */
export function formatUsd(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

/** Convert a dollar input like "12.50" into integer cents */
export function dollarsToCents(value: string | number): number {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (!Number.isFinite(num) || num < 0) return 0;
  return Math.round(num * 100);
}

/** Convert cents into a dollar string suitable for form inputs */
export function centsToDollarInput(cents: number): string {
  return (cents / 100).toFixed(2);
}
