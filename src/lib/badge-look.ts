/**
 * Live field scatter. Rolled with Math.random() on the client so every
 * refresh (and every L→R wrap) gets a new X, Y, and tilt.
 *
 * Type size, weight, and drift speed are NOT rolled here — those come
 * from listing.level via getLevelVisual.
 *
 * The path is a 200vw strip centered on the 100vw viewport:
 *   -50vw (off left) → 0–100vw (screen) → 150vw (off right).
 * A soft cap keeps the visible band readable; extras wait off the left
 * edge and enter in sequence instead of stacking on first paint.
 */

/** 200vw strip centered on the screen. */
export const DRIFT_FROM_VW = -50;
export const DRIFT_TO_VW = 150;
export const DRIFT_SPAN_VW = DRIFT_TO_VW - DRIFT_FROM_VW;

/** Visible screen in progress units (0vw and 100vw on the strip). */
export const VIEW_PROGRESS_MIN = (0 - DRIFT_FROM_VW) / DRIFT_SPAN_VW; // 0.25
export const VIEW_PROGRESS_MAX = (100 - DRIFT_FROM_VW) / DRIFT_SPAN_VW; // 0.75

/**
 * Place a little inside the left/right edges so a wide pill is not
 * already hanging off — still starts near the left, not the center.
 */
const VIEW_PLACE_MIN = VIEW_PROGRESS_MIN + 0.02;
const VIEW_PLACE_MAX = VIEW_PROGRESS_MAX - 0.06;

/** How many badges may sit in the viewport on first paint. */
export const ON_SCREEN_CAP = 18;
/** How many may live on the 200vw strip at t=0 (visible + wings). */
export const STRIP_CAP = 36;

export const MIN_LANE = 0.14;
export const MAX_LANE = 0.84;
const MIN_LANE_GAP = 0.11;

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  /** 0–1 point along the L→R path (0 = −50vw, before the left edge) */
  progress: number;
  /** Seconds to sit still at the rolled XY before drifting */
  enterDelay: number;
  rotateDeg: number;
  bobEm: number;
  bobDuration: number;
};

export function progressToVw(progress: number): number {
  return DRIFT_FROM_VW + progress * DRIFT_SPAN_VW;
}

export function vwToProgress(vw: number): number {
  return (vw - DRIFT_FROM_VW) / DRIFT_SPAN_VW;
}

export function clampLane(lane: number): number {
  return Math.min(MAX_LANE, Math.max(MIN_LANE, lane));
}

export function clampProgress(progress: number): number {
  return Math.min(1, Math.max(0, progress));
}

export function isOnScreen(progress: number): boolean {
  return progress >= VIEW_PROGRESS_MIN && progress <= VIEW_PROGRESS_MAX;
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

function shuffle<T>(items: readonly T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const a = next[i]!;
    next[i] = next[j]!;
    next[j] = a;
  }
  return next;
}

export function rollMotion(): Pick<
  BadgeLook,
  "rotateDeg" | "bobEm" | "bobDuration"
> {
  const tiltSign = Math.random() < 0.5 ? -1 : 1;
  return {
    rotateDeg: tiltSign * rand(4, 13),
    bobEm: rand(0.16, 0.5),
    bobDuration: rand(3.6, 7.4),
  };
}

export function rollLane(occupied: number[]): number {
  for (let attempt = 0; attempt < 24; attempt++) {
    const lane = rand(MIN_LANE, MAX_LANE);
    if (occupied.every((y) => Math.abs(y - lane) >= MIN_LANE_GAP)) {
      return lane;
    }
  }
  return rand(MIN_LANE, MAX_LANE);
}

type Slot = { progress: number; lane: number };

/**
 * Stratified grid across a progress band so neighbors sit in different
 * cells (X and Y) instead of dart-throwing into the same pile.
 */
function packBand(count: number, pMin: number, pMax: number): Slot[] {
  if (count <= 0) return [];

  const xSpan = Math.max(0.04, pMax - pMin);
  const ySpan = MAX_LANE - MIN_LANE;
  const widthVw = xSpan * DRIFT_SPAN_VW;
  const aspect = widthVw / Math.max(ySpan * 100, 1);
  let cols = Math.max(1, Math.round(Math.sqrt(count * Math.max(aspect, 0.5))));
  let rows = Math.max(1, Math.ceil(count / cols));

  while (rows > 1 && ySpan / rows < 0.08) {
    cols += 1;
    rows = Math.ceil(count / cols);
  }

  const cells: Slot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      cells.push({
        progress: pMin + ((c + 0.5) / cols) * xSpan,
        lane: MIN_LANE + ((r + 0.5) / rows) * ySpan,
      });
    }
  }

  return shuffle(cells)
    .slice(0, count)
    .map((cell) => ({
      progress: clamp(
        cell.progress + rand(-0.28, 0.28) * (xSpan / cols),
        pMin,
        pMax
      ),
      lane: clamp(
        cell.lane + rand(-0.28, 0.28) * (ySpan / rows),
        MIN_LANE,
        MAX_LANE
      ),
    }));
}

/** Fresh scatter for a page load / remount. */
export function rollField(ids: string[]): Map<string, BadgeLook> {
  const map = new Map<string, BadgeLook>();
  const order = shuffle(ids);
  const n = order.length;

  const onScreen = Math.min(n, ON_SCREEN_CAP);
  const onStrip = Math.min(n, STRIP_CAP);
  const wingCount = onStrip - onScreen;
  const leftWings = Math.round(wingCount * 0.72);
  const rightWings = wingCount - leftWings;
  const queued = n - onStrip;

  const screenSlots = packBand(onScreen, VIEW_PLACE_MIN, VIEW_PLACE_MAX);
  const leftSlots = packBand(leftWings, 0.02, VIEW_PROGRESS_MIN - 0.012);
  const rightSlots = packBand(
    rightWings,
    VIEW_PROGRESS_MAX + 0.012,
    0.93
  );
  const queueSlots = packBand(queued, 0, 0.06);

  let i = 0;
  const place = (slot: Slot, enterDelay: number) => {
    const id = order[i];
    if (!id) return;
    map.set(id, {
      ...rollMotion(),
      lane: slot.lane,
      progress: slot.progress,
      enterDelay,
    });
    i += 1;
  };

  screenSlots.forEach((slot) => place(slot, rand(0, 0.28)));
  leftSlots.forEach((slot) => place(slot, rand(0.12, 0.7)));
  rightSlots.forEach((slot) => place(slot, rand(0, 0.2)));
  queueSlots.forEach((slot, k) => {
    // Past the strip cap: hold just left of the world and stream in.
    place(slot, 0.85 + k * rand(0.42, 0.78));
  });

  return map;
}

/** New Y + tilt when a badge wraps. Progress is reset to 0 (−50vw) by the mover. */
export function rerollOnLoop(
  current: BadgeLook,
  occupiedLanes: number[]
): BadgeLook {
  const next = rollMotion();
  return {
    ...current,
    rotateDeg: next.rotateDeg,
    bobEm: next.bobEm,
    bobDuration: next.bobDuration,
    lane: rollLane(occupiedLanes),
    progress: 0,
    enterDelay: 0,
  };
}
