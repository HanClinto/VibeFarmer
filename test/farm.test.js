import assert from "node:assert/strict";
import test from "node:test";

import { isWalkable } from "../src/game/actions/actions.js";
import { createFarmState } from "../src/game/farm.js";
import { getWorldObject } from "../src/game/world/world.js";

test("canonical farm construction is headless and uses stable entity ids", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");

  const first = createFarmState();
  const second = createFarmState();
  assert.equal(first.world.maps.farm.width, 24);
  assert.equal(first.world.maps.farm.terrain, first.world.terrain);
  assert.equal(first.world.width, 24);
  assert.equal(first.world.height, 18);
  assert.deepEqual(first.world.entities.player.position, { x: 5, y: 5 });
  assert.deepEqual(first.world.entities.robot.position, { x: 6, y: 5 });
  assert.equal(first.world.entities["portal-farmhouse-door"].name, "Farmhouse door");
  assert.equal(first.world.maps.farmhouse.width, 8);
  assert.equal(first.world.entities["bed-player"].mapId, "farmhouse");
  assert.equal(first.world.entities["bed-player"].spriteId, "furniture.bed_green.left");
  assert.equal(first.world.entities["bed-robot"].spriteId, "furniture.bed_orange.left");
  assert.equal(first.world.entities["inside-wall-top-0"].mapId, "farmhouse");
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

test("world queries isolate entities on different maps", () => {
  const state = createFarmState();
  const position = { x: 3, y: 3 };
  state.world.entities["inside-table"] = {
    id: "inside-table",
    type: "decoration",
    mapId: "farmhouse",
    position,
  };

  assert.equal(getWorldObject(state.world, { mapId: "farm", ...position }).id, "house-2-1");
  assert.equal(
    getWorldObject(state.world, { mapId: "farmhouse", ...position }).id,
    "inside-table",
  );
});