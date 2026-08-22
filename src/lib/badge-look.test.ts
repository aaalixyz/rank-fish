import assert from "node:assert/strict";
import {
  DRIFT_FROM_VW,
  DRIFT_SPAN_VW,
  DRIFT_TO_VW,
  ON_SCREEN_CAP,
  STRIP_CAP,
  VIEW_PROGRESS_MAX,
  VIEW_PROGRESS_MIN,
  isOnScreen,
  progressToVw,
  rollField,
} from "./badge-look";

assert.equal(DRIFT_SPAN_VW, 200);
assert.equal(DRIFT_FROM_VW, -50);
assert.equal(DRIFT_TO_VW, 150);
assert.ok(Math.abs(VIEW_PROGRESS_MIN - 0.25) < 1e-9);
assert.ok(Math.abs(VIEW_PROGRESS_MAX - 0.75) < 1e-9);

const smallIds = ["a", "b", "c"];
const first = rollField(smallIds);
const second = rollField(smallIds);

assert.equal(first.size, 3);
assert.equal(second.size, 3);

for (const id of smallIds) {
  const look = first.get(id);
  assert.ok(look, `missing ${id}`);
  assert.ok(look.lane >= 0.14 && look.lane <= 0.84, `lane ${look.lane}`);
  assert.ok(
    isOnScreen(look.progress),
    `small boards stay on-screen, got ${look.progress}`
  );
  assert.ok(Math.abs(look.rotateDeg) >= 4 && Math.abs(look.rotateDeg) <= 13);
  const x = progressToVw(look.progress);
  assert.ok(x >= 0 && x <= 100, `small-board x ${x}`);
}

const firstSignature = smallIds
  .map((id) => {
    const look = first.get(id)!;
    return `${look.lane.toFixed(4)}:${look.progress.toFixed(4)}:${look.rotateDeg.toFixed(2)}`;
  })
  .join("|");
const secondSignature = smallIds
  .map((id) => {
    const look = second.get(id)!;
    return `${look.lane.toFixed(4)}:${look.progress.toFixed(4)}:${look.rotateDeg.toFixed(2)}`;
  })
  .join("|");

assert.notEqual(
  firstSignature,
  secondSignature,
  "two rolls should not match"
);

const crowded = Array.from({ length: 50 }, (_, i) => `id-${i}`);
const packed = rollField(crowded);
assert.equal(packed.size, 50);

const looks = crowded.map((id) => packed.get(id)!);
const onScreen = looks.filter((look) => isOnScreen(look.progress));
const offLeft = looks.filter((look) => look.progress < VIEW_PROGRESS_MIN);
const queued = looks.filter((look) => look.enterDelay >= 0.85);

assert.equal(
  onScreen.length,
  ON_SCREEN_CAP,
  `visible first paint should cap at ${ON_SCREEN_CAP}, got ${onScreen.length}`
);
assert.ok(offLeft.length >= 50 - ON_SCREEN_CAP - 8, "many start off the left");
assert.ok(
  looks.length - STRIP_CAP === queued.length,
  "overflow past the strip cap streams in on a delay"
);
assert.ok(
  Math.max(...looks.map((look) => look.enterDelay)) > 2,
  "crowded boards stagger appearance"
);

let minScreenSep = Infinity;
for (let i = 0; i < onScreen.length; i++) {
  for (let j = i + 1; j < onScreen.length; j++) {
    const dx =
      Math.abs(onScreen[i]!.progress - onScreen[j]!.progress) * DRIFT_SPAN_VW;
    const dy = Math.abs(onScreen[i]!.lane - onScreen[j]!.lane) * 100;
    const sep = Math.hypot(dx, dy);
    if (sep < minScreenSep) minScreenSep = sep;
  }
}
assert.ok(
  minScreenSep > 8,
  `on-screen badges should not stack (min sep ${minScreenSep.toFixed(2)})`
);

console.log("badge-look: ok");
