/**
 * Stable, per-listing visual jitter so the field does not look lined-up.
 * Hashed from listing id — same on server and client (no hydration flicker).
 */

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  rotateDeg: number;
  weight: 500 | 600 | 700 | 800;
  trackingEm: number;
  /** Tiny scale jitter that does not invert level ranking */
  scale: number;
  bobPx: number;
  bobDuration: number;
  /** 0–1 animation phase */
  phase: number;
  speedJitter: number;
};

function hash01(seed: string, salt: number): number {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return (h >>> 0) / 4294967295;
}

const WEIGHTS = [500, 600, 700, 800] as const;

export function getBadgeLook(id: string): BadgeLook {
  return {
    lane: 0.16 + hash01(id, 11) * 0.68,
    rotateDeg: (hash01(id, 22) - 0.5) * 12,
    weight: WEIGHTS[Math.floor(hash01(id, 33) * WEIGHTS.length) % WEIGHTS.length],
    trackingEm: -0.045 + hash01(id, 44) * 0.07,
    scale: 0.96 + hash01(id, 55) * 0.08,
    bobPx: 3 + hash01(id, 66) * 8,
    bobDuration: 4.5 + hash01(id, 77) * 5,
    phase: hash01(id, 88),
    speedJitter: 0.88 + hash01(id, 99) * 0.24,
  };
}
