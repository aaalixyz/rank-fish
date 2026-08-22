/**
 * Helpers for turning a level (1–100) into visual size + drift speed.
 *
 * Size is absolute from the level — a lone Lv 25 is mid-field, not maxed out
 * just because it is the only listing. Bigger / higher level → slower drift.
 */

import { MAX_LEVEL, MIN_LEVEL } from "@/lib/pricing";

export type BidVisual = {
  /** 0–1 level strength (Lv 1 → 0, Lv 100 → 1) */
  strength: number;
  /** 0–1 opacity */
  opacity: number;
  /** Seconds for one full left→right loop (bigger = slower) */
  duration: number;
  /** Font weight from level (500–800). Not randomized. */
  weight: 500 | 600 | 700 | 800;
  /** Letter-spacing from level. Tighter as the mark gets bigger. */
  trackingEm: number;
};

const MIN_OPACITY = 0.9;
const MAX_OPACITY = 1;
const MIN_DURATION = 16;
const MAX_DURATION = 44;
const WEIGHTS = [500, 600, 700, 800] as const;

function weightFromStrength(strength: number): (typeof WEIGHTS)[number] {
  const index = Math.min(
    WEIGHTS.length - 1,
    Math.floor(strength * WEIGHTS.length)
  );
  return WEIGHTS[index];
}

export function getLevelVisual(level: number): BidVisual {
  const safe = Math.min(MAX_LEVEL, Math.max(MIN_LEVEL, level));
  const strength = (safe - MIN_LEVEL) / (MAX_LEVEL - MIN_LEVEL);

  return {
    strength,
    opacity: MIN_OPACITY + strength * (MAX_OPACITY - MIN_OPACITY),
    duration: MIN_DURATION + strength * (MAX_DURATION - MIN_DURATION),
    weight: weightFromStrength(strength),
    trackingEm: 0.012 - strength * 0.055,
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
