import assert from "node:assert/strict";
import test from "node:test";

import {
  chestFrameId,
  getActorRenderPosition,
  operationPreview,
  terrainFrameId,
} from "../src/adapters/browser/renderer.js";

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

test("storage presentation selects matching closed and open chest frames", () => {
  assert.equal(chestFrameId(false), "entity.chest.closed");
  assert.equal(chestFrameId(true), "entity.chest.open");
});

test("water terrain selects matching nine-slice pond frames", () => {
  const world = {
    terrain: Array.from({ length: 3 }, () => Array(3).fill("water")),
  };
  assert.equal(terrainFrameId(world, 0, 0), "terrain.water.top_left");
  assert.equal(terrainFrameId(world, 1, 0), "terrain.water.top");
  assert.equal(terrainFrameId(world, 2, 0), "terrain.water.top_right");
  assert.equal(terrainFrameId(world, 0, 1), "terrain.water.left");
  assert.equal(terrainFrameId(world, 1, 1), "terrain.water.center");
  assert.equal(terrainFrameId(world, 2, 1), "terrain.water.right");
  assert.equal(terrainFrameId(world, 0, 2), "terrain.water.bottom_left");
  assert.equal(terrainFrameId(world, 1, 2), "terrain.water.bottom");
  assert.equal(terrainFrameId(world, 2, 2), "terrain.water.bottom_right");
});

test("path terrain uses the stepping-stone route frame", () => {
  assert.equal(terrainFrameId({ terrain: [["path"]] }, 0, 0), "terrain.path");
});

test("interior floor terrain uses the wood floor frame", () => {
  assert.equal(terrainFrameId({ terrain: [["floor"]] }, 0, 0), "interior.floor_wood");
});

test("operation preview exposes only current-map route steps and destination", () => {
  const state = {
    world: { entities: { player: { mapId: "farm", activeIntent: "operation-1" } } },
    operations: {
      "operation-1": {
        path: [
          { mapId: "farm", x: 2, y: 3 },
          { mapId: "farmhouse", x: 4, y: 4 },
        ],
        command: { target: { mapId: "farm", x: 3, y: 3 } },
      },
    },
  };

  assert.deepEqual(operationPreview(state, "player"), {
    mapId: "farm",
    path: [{ mapId: "farm", x: 2, y: 3 }],
    destination: { mapId: "farm", x: 3, y: 3 },
  });
  state.world.entities.player.activeIntent = null;
  assert.equal(operationPreview(state, "player"), null);
});