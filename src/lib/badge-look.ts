/**
 * Live field placement. Values are rolled with Math.random() on the client
 * so every refresh (and every L→R wrap) gets a new XY / tilt / enter time.
 * Do not call these during SSR — BadgeField waits until mount.
 */

const WEIGHTS = [500, 600, 700, 800] as const;

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  /** 0–1 point along the L→R loop (used as a negative animation delay) */
  phase: number;
  /** Extra seconds to wait before first entering from the left */
  enterDelay: number;
  rotateDeg: number;
  weight: (typeof WEIGHTS)[number];
  trackingEm: number;
  scale: number;
  bobEm: number;
  bobDuration: number;
  speedJitter: number;
};

const MIN_Y = 0.18;
const MAX_Y = 0.88;
const MIN_LANE_GAP = 0.1;

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickWeight(): (typeof WEIGHTS)[number] {
  return WEIGHTS[Math.floor(Math.random() * WEIGHTS.length)];
}

export function rollPersonality(): Omit<BadgeLook, "lane" | "phase" | "enterDelay"> {
  return {
    rotateDeg: rand(-16, 16),
    weight: pickWeight(),
    trackingEm: rand(-0.06, 0.08),
    scale: rand(0.84, 1.16),
    bobEm: rand(1.4, 4.8),
    bobDuration: rand(3.2, 8.4),
    speedJitter: rand(0.62, 1.45),
  };
}

export function rollLane(occupied: number[]): number {
  for (let attempt = 0; attempt < 12; attempt++) {
    const lane = rand(MIN_Y, MAX_Y);
    if (occupied.every((y) => Math.abs(y - lane) >= MIN_LANE_GAP)) {
      return lane;
    }
  }
  return rand(MIN_Y, MAX_Y);
}

function rollPhase(taken: number[]): number {
  for (let attempt = 0; attempt < 12; attempt++) {
    const phase = Math.random();
    if (taken.every((p) => circularGap(p, phase) >= 0.18)) {
      return phase;
    }
  }
  return Math.random();
}

function circularGap(a: number, b: number) {
  const d = Math.abs(a - b);
  return Math.min(d, 1 - d);
}

/** Fresh scatter for a page load / remount. */
export function rollField(ids: string[]): Map<string, BadgeLook> {
  const map = new Map<string, BadgeLook>();
  const lanes: number[] = [];
  const phases: number[] = [];
  const order = [...ids].sort(() => Math.random() - 0.5);

  order.forEach((id, rank) => {
    const lane = rollLane(lanes);
    lanes.push(lane);

    // Some wait off-stage, then enter from the left; others are already mid-drift.
    const waitsToEnter = Math.random() < 0.4;
    const phase = waitsToEnter ? 0 : rollPhase(phases);
    if (!waitsToEnter) phases.push(phase);

    map.set(id, {
      ...rollPersonality(),
      lane,
      phase,
      enterDelay: waitsToEnter ? rank * rand(0.35, 1.4) + rand(0.1, 0.8) : 0,
    });
  });

  return map;
}

/** New Y / tilt / weave when a badge wraps. Keep delay/speed so the CSS loop does not restart. */
export function rerollOnLoop(current: BadgeLook, occupiedLanes: number[]): BadgeLook {
  const next = rollPersonality();
  return {
    ...current,
    rotateDeg: next.rotateDeg,
    weight: next.weight,
    trackingEm: next.trackingEm,
    scale: next.scale,
    bobEm: next.bobEm,
    bobDuration: next.bobDuration,
    lane: rollLane(occupiedLanes),
  };
}
