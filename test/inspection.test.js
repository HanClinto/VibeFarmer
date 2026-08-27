import assert from "node:assert/strict";
import test from "node:test";

import { inspectLocation } from "../src/game/world/inspection.js";
import { createGameState } from "../src/game/state.js";
import { createChest } from "../src/game/world/entities/containers/chests.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { addWorldEntity } from "../src/game/world/world.js";

test("inspection exposes tree health and crop growth with water state", () => {
  const state = createGameState();
  state.world.terrain[2][1] = "wet_tilled";
  addWorldEntity(state.world, {
    id: "tree-test",
    type: "tree",
    position: { x: 3, y: 2 },
    hitPoints: 2,
  });
  const plant = createPlant({
    id: "plant-test",
    cropType: "turnip",
    position: { x: 1, y: 2 },
  });
  plant.growthStage = 2;
  addWorldEntity(state.world, plant);

  const tree = inspectLocation(state, "player", { x: 3, y: 2 }).entities[0];
  assert.deepEqual(
    { hitPoints: tree.hitPoints, maxHitPoints: tree.maxHitPoints, blocking: tree.blocking },
    { hitPoints: 2, maxHitPoints: 3, blocking: true },
  );
  const crop = inspectLocation(state, "player", { x: 1, y: 2 });
  assert.equal(crop.terrain.watered, true);
  assert.deepEqual(
    {
      growthStage: crop.entities[0].growthStage,
      matureStage: crop.entities[0].matureStage,
      watered: crop.entities[0].watered,
      harvestReady: crop.entities[0].harvestReady,
    },
    { growthStage: 2, matureStage: 3, watered: true, harvestReady: false },
  );
});

test("inventory inspection respects adjacency and player privacy", () => {
  const state = createGameState();
  addWorldEntity(state.world, createChest({
    id: "chest-test",
    position: { x: 0, y: 1 },
    inventory: [{ itemId: "logs", quantity: 2 }],
  }));

  const adjacentChest = inspectLocation(state, "player", { x: 0, y: 1 }).entities[0];
  assert.equal(adjacentChest.inventory[0].itemId, "logs");
  const robotForPlayer = inspectLocation(state, "player", { x: 2, y: 1 }).entities[0];
  assert.equal(robotForPlayer.inventory[0].itemId, "axe");
  const playerForRobot = inspectLocation(state, "robot", { x: 1, y: 1 }).entities[0];
  assert.equal("inventory" in playerForRobot, false);

  state.world.entities.player.position = { x: 5, y: 5 };
  const distantChest = inspectLocation(state, "player", { x: 0, y: 1 }).entities[0];
  assert.equal("inventory" in distantChest, false);
});