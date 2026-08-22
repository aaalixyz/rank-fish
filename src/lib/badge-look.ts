/**
 * Per-listing personality + field layout.
 *
 * Looks are hashed from listing.id (stable SSR/hydration). Positions and
 * start-times are assigned as a group so two badges cannot land on the same
 * band or the same spot in the loop — hash-only jitter was too subtle.
 */

const WEIGHTS = [500, 600, 700, 800] as const;

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  rotateDeg: number;
  weight: (typeof WEIGHTS)[number];
  trackingEm: number;
  /** Extra scale on top of level size; kept modest so ranking still reads */
  scale: number;
  /** Vertical weave, in em so it tracks font-size / viewport */
  bobEm: number;
  bobDuration: number;
  /** 0–1 animation phase along the L→R loop */
  phase: number;
  speedJitter: number;
};

const MIN_Y = 0.18;
const MAX_Y = 0.88;

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

function wrap01(n: number) {
  return ((n % 1) + 1) % 1;
}

function personality(id: string): Omit<BadgeLook, "lane" | "phase"> {
  const h = (salt: number) => hashUnit(id, salt);
  return {
    rotateDeg: mix(-18, 18, h(23)),
    weight: WEIGHTS[Math.floor(h(7) * WEIGHTS.length) % WEIGHTS.length],
    trackingEm: mix(-0.07, 0.09, h(29)),
    scale: mix(0.8, 1.18, h(41)),
    bobEm: mix(1.6, 5.2, h(53)),
    bobDuration: mix(3.1, 8.8, h(67)),
    speedJitter: mix(0.58, 1.52, h(17)),
  };
}

/**
 * Assign every badge a unique vertical band and a unique start point on the
 * L→R loop. Hash order is stable, so refresh does not reshuffle the field.
 */
export function layoutField(
  listings: { id: string }[]
): Map<string, BadgeLook> {
  const n = listings.length;
  const map = new Map<string, BadgeLook>();
  if (n === 0) return map;

  const ordered = [...listings].sort(
    (a, b) => hashUnit(a.id, 3) - hashUnit(b.id, 3) || a.id.localeCompare(b.id)
  );

  const span = MAX_Y - MIN_Y;
  const band = span / n;

  ordered.forEach((listing, rank) => {
    const look = personality(listing.id);

    const lane =
      n === 1
        ? mix(MIN_Y + 0.08, MAX_Y - 0.08, hashUnit(listing.id, 11))
        : clamp(
            MIN_Y +
              (rank + 0.5) * band +
              (hashUnit(listing.id, 19) - 0.5) * band * 0.28,
            MIN_Y,
            MAX_Y
          );

    const phase = wrap01(
      rank / n + (hashUnit(listing.id, 1) - 0.5) * (0.55 / n)
    );

    map.set(listing.id, { ...look, lane, phase });
  });

  return map;
}
