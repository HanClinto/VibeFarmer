import assert from "node:assert/strict";
import test from "node:test";

import { createFarmState } from "../src/game/farm.js";

test("canonical farm construction is headless and uses stable entity ids", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");

  const first = createFarmState();
  const second = createFarmState();
  assert.deepEqual(Object.keys(first.world.entities).sort(), [
    "chest-1",
    "player",
    "robot",
    "tree-1",
    "tree-2",
    "tree-3",
    "tree-4",
  ]);
  assert.deepEqual(first, second);
  assert.notEqual(first.world, second.world);
});