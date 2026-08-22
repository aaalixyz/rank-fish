/**
 * Live field scatter. Rolled with Math.random() on the client so every
 * refresh (and every L→R wrap) gets a new X, Y, and tilt.
 *
 * Type size, weight, and drift speed are NOT rolled here — those come
 * from listing.level via getLevelVisual.
 *
 * X is an explicit 0–1 progress along the drift path — not a CSS
 * animation-delay — so the first paint is already in a random place.
 */

export const DRIFT_FROM_VW = -18;
export const DRIFT_TO_VW = 108;
export const DRIFT_SPAN_VW = DRIFT_TO_VW - DRIFT_FROM_VW;

/** Keep starting X on-screen so a reload never looks empty.
 *  Stay left of ~0.68 so a wide Lv 25 pill is not already half off the right. */
const VISIBLE_PROGRESS_MIN = 0.18;
const VISIBLE_PROGRESS_MAX = 0.68;

const MIN_Y = 0.16;
const MAX_Y = 0.82;
const MIN_LANE_GAP = 0.14;
const MIN_PROGRESS_GAP = 0.2;

export type BadgeLook = {
  /** Vertical position, 0–1 of the field */
  lane: number;
  /** 0–1 point along the L→R path (0 = just left of the viewport) */
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

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export function rollMotion(): Pick<
  BadgeLook,
  "rotateDeg" | "bobEm" | "bobDuration"
> {
  const tiltSign = Math.random() < 0.5 ? -1 : 1;
  return {
    // Always a few degrees so tilt is visible; cap so it stays slight.
    rotateDeg: tiltSign * rand(4, 13),
    bobEm: rand(0.16, 0.5),
    bobDuration: rand(3.6, 7.4),
  };
}

export function rollLane(occupied: number[]): number {
  for (let attempt = 0; attempt < 16; attempt++) {
    const lane = rand(MIN_Y, MAX_Y);
    if (occupied.every((y) => Math.abs(y - lane) >= MIN_LANE_GAP)) {
      return lane;
    }
  }
  return rand(MIN_Y, MAX_Y);
}

function rollProgress(taken: number[]): number {
  for (let attempt = 0; attempt < 16; attempt++) {
    const progress = rand(VISIBLE_PROGRESS_MIN, VISIBLE_PROGRESS_MAX);
    if (taken.every((p) => Math.abs(p - progress) >= MIN_PROGRESS_GAP)) {
      return progress;
    }
  }
  return rand(VISIBLE_PROGRESS_MIN, VISIBLE_PROGRESS_MAX);
}

/** Fresh scatter for a page load / remount. Every badge starts on-screen. */
export function rollField(ids: string[]): Map<string, BadgeLook> {
  const map = new Map<string, BadgeLook>();
  const lanes: number[] = [];
  const progresses: number[] = [];
  const order = [...ids].sort(() => Math.random() - 0.5);

  order.forEach((id, rank) => {
    const lane = rollLane(lanes);
    lanes.push(lane);
    const progress = rollProgress(progresses);
    progresses.push(progress);

    map.set(id, {
      ...rollMotion(),
      lane,
      progress,
      enterDelay: rank * rand(0.08, 0.22),
    });
  });

  return map;
}

/** New Y + tilt when a badge wraps. Progress is reset to 0 by the mover. */
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
