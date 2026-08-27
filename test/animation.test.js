import assert from "node:assert/strict";
import test from "node:test";

import { getActorRenderPosition } from "../src/adapters/browser/renderer.js";

test("actor rendering interpolates a tile transition without changing game position", () => {
  const actor = {
    position: { x: 3, y: 2 },
    facing: "east",
    motion: {
      from: { x: 2, y: 2 },
      to: { x: 3, y: 2 },
      startedTick: 7,
      durationTicks: 2,
    },
  };

  assert.deepEqual(getActorRenderPosition(actor, 7, 0), { x: 2, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 7, 1), { x: 2.5, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 8, 0.5), { x: 2.75, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 8, 1), { x: 3, y: 2 });
  assert.deepEqual(actor.position, { x: 3, y: 2 });
});

test("completed transitions render at the authoritative tile", () => {
  const actor = {
    position: { x: 4, y: 5 },
    facing: "south",
    motion: {
      from: { x: 4, y: 4 },
      to: { x: 4, y: 5 },
      startedTick: 11,
      durationTicks: 1,
    },
  };

  assert.deepEqual(getActorRenderPosition(actor, 12, 0), { x: 4, y: 5 });
});