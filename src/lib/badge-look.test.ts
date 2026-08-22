import assert from "node:assert/strict";
import {
  DRIFT_FROM_VW,
  DRIFT_TO_VW,
  progressToVw,
  rollField,
} from "./badge-look";

const ids = ["a", "b", "c"];

const first = rollField(ids);
const second = rollField(ids);

assert.equal(first.size, 3);
assert.equal(second.size, 3);

for (const id of ids) {
  const look = first.get(id);
  assert.ok(look, `missing ${id}`);
  assert.ok(look.lane >= 0.16 && look.lane <= 0.82, `lane ${look.lane}`);
  assert.ok(
    look.progress >= 0.16 && look.progress <= 0.84,
    `progress ${look.progress}`
  );
  assert.ok(Math.abs(look.rotateDeg) >= 4 && Math.abs(look.rotateDeg) <= 13);
  const x = progressToVw(look.progress);
  assert.ok(x > DRIFT_FROM_VW && x < DRIFT_TO_VW);
}

const firstSignature = ids
  .map((id) => {
    const look = first.get(id)!;
    return `${look.lane.toFixed(4)}:${look.progress.toFixed(4)}:${look.rotateDeg.toFixed(2)}`;
  })
  .join("|");
const secondSignature = ids
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

console.log("badge-look: ok");
