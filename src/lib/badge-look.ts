/**
 * Stable, per-listing visual jitter so the field does not look lined-up.
 * Hashed from listing.id — same on server and client (no hydration flicker).
 */

const GOLDEN = 0.6180339887498949;
const WEIGHTS = [500, 600, 700, 800] as const;

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  rotateDeg: number;
  weight: (typeof WEIGHTS)[number];
  trackingEm: number;
  /** Tiny scale jitter that does not erase level ranking */
  scale: number;
  /** Bob amplitude, in em so it tracks font-size / viewport */
  bobEm: number;
  bobDuration: number;
  /** 0–1 animation phase */
  phase: number;
  speedJitter: number;
};

/** Deterministic 0..1 from a string seed + salt. */
export function hashUnit(seed: string, salt = 0): number {
  let h = 2166136261 ^ (salt | 0);
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  h ^= h >>> 16;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

function mix(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Golden-ratio lanes keep badges from stacking; id-hash scatter
 * breaks the even grid. `strength` lightly biases weight so bigger
 * levels still read heavier without locking every badge to one cut.
 */
export function getBadgeLook(
  id: string,
  index = 0,
  strength = 0.5
): BadgeLook {
  const h = (salt: number) => hashUnit(id, salt);

  const spread = (index * GOLDEN) % 1;
  const scatter = (h(11) - 0.5) * 0.18;
  const lane = clamp(0.12 + spread * 0.72 + scatter, 0.1, 0.86);

  const weightT = clamp(strength * 0.5 + h(7) * 0.5, 0, 0.999);

  return {
    lane,
    rotateDeg: mix(-5.5, 5.5, h(23)),
    weight: WEIGHTS[Math.floor(weightT * WEIGHTS.length)],
    trackingEm: mix(-0.055, 0.055, h(29)),
    scale: mix(0.94, 1.06, h(41)),
    bobEm: mix(0.12, 0.48, h(53)),
    bobDuration: mix(3.6, 7.2, h(67)),
    phase: h(1),
    speedJitter: mix(0.84, 1.2, h(17)),
  };
}
