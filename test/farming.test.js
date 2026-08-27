import assert from "node:assert/strict";
import test from "node:test";

import { sleepActor, useItem } from "../src/game/actions/actions.js";
import { createGameState } from "../src/game/state.js";
import { getWorldEntitiesByType } from "../src/game/world/world.js";

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