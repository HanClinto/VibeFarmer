import assert from "node:assert/strict";
import test from "node:test";

import { isWalkable } from "../src/game/actions/actions.js";
import { createFarmState } from "../src/game/farm.js";

test("canonical farm construction is headless and uses stable entity ids", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");

  const first = createFarmState();
  const second = createFarmState();
  assert.equal(first.world.width, 24);
  assert.equal(first.world.height, 18);
  assert.deepEqual(first.world.entities.player.position, { x: 5, y: 5 });
  assert.deepEqual(first.world.entities.robot.position, { x: 6, y: 5 });
  assert.equal(first.world.entities["house-3-1"].name, "Farmhouse door");
  assert.ok(first.world.entities["market-sign"]);
  assert.ok(first.world.entities["tree-8"]);
  assert.equal(first.world.terrain[3][16], "water");
  assert.equal(first.world.terrain[6][10], "path");
  assert.equal(isWalkable(first, { x: 4, y: 4 }, "player"), false);
  assert.equal(isWalkable(first, { x: 16, y: 3 }, "player"), false);
  assert.equal(isWalkable(first, { x: 4, y: 7 }, "player"), true);
  assert.deepEqual(first, second);
  assert.notEqual(first.world, second.world);
});