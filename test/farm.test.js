import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { isWalkable } from "../src/game/actions/actions.js";
import { createFarmState } from "../src/game/farm.js";
import { getWorldEntitiesByType, getWorldObject } from "../src/game/world/world.js";

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
  assert.equal(first.world.entities["bed-player"].spriteId, "furniture.bed_cream");
  assert.equal(first.world.entities["bed-robot"].spriteId, "furniture.bed_orange");
  assert.equal(first.world.entities["bed-player-foot"], undefined);
  assert.equal(first.world.entities["bed-robot-foot"], undefined);
  assert.equal(first.world.entities["inside-wall-top-0"].mapId, "farmhouse");
  assert.equal(
    first.world.entities["inside-wall-top-0"].spriteId,
    "interior.wall_warm_masonry",
  );
  assert.deepEqual(
    ["market-corn-crate", "market-tomato-crate", "market-leafy-crate"].map(
      (entityId) => first.world.entities[entityId].spriteId,
    ),
    ["entity.produce_corn", "entity.produce_tomato", "entity.produce_leafy"],
  );
  assert.equal(first.world.entities["market-corn-crate"].type, "market");
  assert.ok(first.world.entities["market-corn-crate"]);
  assert.ok(first.world.entities["tree-8"]);
  assert.equal(getWorldEntitiesByType(first.world, "tree", "farm").length, 20);
  assert.ok(first.world.entities["tree-14"]);
  assert.ok(first.world.entities["tree-19"]);
  assert.equal(first.world.terrain[3][16], "water");
  assert.equal(first.world.terrain[6][10], "path");
  assert.equal(isWalkable(first, { x: 4, y: 4 }, "player"), false);
  assert.equal(isWalkable(first, { x: 16, y: 3 }, "player"), false);
  assert.equal(isWalkable(first, { x: 4, y: 7 }, "player"), true);
  assert.deepEqual(first, second);
  assert.notEqual(first.world, second.world);
});

test("dense starting trees preserve grass placement and critical farm routes", () => {
  const state = createFarmState();
  const trees = getWorldEntitiesByType(state.world, "tree", "farm");
  const positions = new Set(trees.map((tree) => `${tree.position.x},${tree.position.y}`));

  assert.equal(positions.size, trees.length);
  assert.ok(trees.every(
    (tree) => state.world.maps.farm.terrain[tree.position.y][tree.position.x] === "grass",
  ));
  for (const target of [
    { x: 3, y: 4 },
    { x: 18, y: 12 },
    { x: 8, y: 8 },
  ]) {
    const controller = createController(createFarmState());
    assert.equal(controller.submit({
      type: "move_to",
      actorId: "player",
      target,
    }).success, true);
  }
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