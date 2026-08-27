import assert from "node:assert/strict";
import test from "node:test";

import {
  buyItem,
  harvest,
  sellItem,
  sleepActor,
  useItem,
} from "../src/game/actions/actions.js";
import { createGameState } from "../src/game/state.js";
import { addWorldEntity } from "../src/game/world/world.js";

test("default resources sustain a complete profitable crop cycle", () => {
  const state = createGameState();
  addWorldEntity(state.world, {
    id: "bed-player",
    type: "bed",
    actorId: "player",
    position: { x: 0, y: 1 },
  });
  const target = { x: 1, y: 2 };
  const startingMoney = state.money;
  const startingSeeds = state.world.entities.player.inventory[3].quantity;

  assert.equal(useItem(state, "player", target, { itemId: "hoe" }).code, "ITEM_USED");
  assert.equal(useItem(
    state,
    "player",
    target,
    { itemId: "watering_can" },
  ).code, "ITEM_USED");
  assert.equal(useItem(
    state,
    "player",
    target,
    { itemId: "turnip_seeds" },
  ).code, "ITEM_USED");

  for (let night = 0; night < 3; night += 1) {
    if (night > 0) {
      assert.equal(useItem(
        state,
        "player",
        target,
        { itemId: "watering_can" },
      ).code, "ITEM_USED");
    }
    assert.equal(sleepActor(state, "player").code, "DAY_ADVANCED");
  }

  assert.equal(harvest(state, "player", target).code, "CROP_HARVESTED");
  assert.equal(sellItem(state, "player", "turnip", 1).code, "ITEM_SOLD");
  assert.equal(buyItem(state, "player", "turnip_seeds", 1).code, "ITEM_BOUGHT");

  assert.equal(state.day, 4);
  assert.equal(state.money, startingMoney + 10);
  assert.equal(state.world.entities.player.inventory[3].quantity, startingSeeds);
  assert.deepEqual(
    state.history.filter((event) => [
      "crop_harvested",
      "item_sold",
      "item_bought",
    ].includes(event.type)).map((event) => event.type),
    ["crop_harvested", "item_sold", "item_bought"],
  );
});