import assert from "node:assert/strict";
import test from "node:test";

import { harvest, sleepActor, useItem } from "../src/game/actions/actions.js";
import { createGameState } from "../src/game/state.js";
import { addWorldEntity, getWorldEntitiesByType } from "../src/game/world/world.js";

test("hoe, water, and seeds create a watered crop that grows overnight", () => {
  const state = createGameState();
  const target = { x: 1, y: 2 };

  assert.equal(useItem(state, "player", target, { itemId: "hoe" }).code, "ITEM_USED");
  assert.equal(state.world.terrain[2][1], "tilled");
  assert.equal(useItem(state, "player", target, { itemId: "watering_can" }).code, "ITEM_USED");
  assert.equal(state.world.terrain[2][1], "wet_tilled");
  assert.equal(useItem(state, "player", target, { itemId: "turnip_seeds" }).code, "ITEM_USED");

  const plants = getWorldEntitiesByType(state.world, "plant");
  assert.equal(plants.length, 1);
  assert.equal(plants[0].growthStage, 0);
  assert.equal(state.world.entities.player.inventory[3].quantity, 5);

  assert.equal(sleepActor(state, "player").code, "DAY_ADVANCED");
  assert.equal(plants[0].growthStage, 1);
  assert.equal(state.world.terrain[2][1], "tilled");
});

test("a mature crop can be harvested into the actor inventory", () => {
  const state = createGameState();
  const target = { x: 1, y: 2 };
  useItem(state, "player", target, { itemId: "hoe" });
  useItem(state, "player", target, { itemId: "watering_can" });
  useItem(state, "player", target, { itemId: "turnip_seeds" });

  for (let day = 0; day < 3; day += 1) {
    if (day > 0) useItem(state, "player", target, { itemId: "watering_can" });
    sleepActor(state, "player");
  }

  const plant = getWorldEntitiesByType(state.world, "plant")[0];
  assert.equal(plant.growthStage, plant.matureStage);
  assert.equal(harvest(state, "player", target).code, "CROP_HARVESTED");
  assert.equal(getWorldEntitiesByType(state.world, "plant").length, 0);
  assert.ok(state.world.entities.player.inventory.some(
    (stack) => stack?.itemId === "turnip" && stack.quantity === 1,
  ));
});

test("the final axe hit converts a tree into logs", () => {
  const state = createGameState();
  const target = { x: 1, y: 2 };
  addWorldEntity(state.world, {
    id: "tree-test",
    type: "tree",
    position: target,
    hitPoints: 1,
  });

  assert.equal(useItem(state, "player", target, { itemId: "axe" }).code, "ITEM_USED");
  assert.equal(state.world.entities["tree-test"], undefined);
  assert.ok(state.world.entities.player.inventory.some(
    (stack) => stack?.itemId === "logs" && stack.quantity === 2,
  ));
});