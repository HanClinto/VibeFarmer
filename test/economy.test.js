import assert from "node:assert/strict";
import test from "node:test";

import { buyItem, sellItem } from "../src/game/actions/actions.js";
import { createGameState } from "../src/game/state.js";

test("buying seeds spends shared money and adds inventory", () => {
  const state = createGameState();
  const startingMoney = state.money;
  const startingSeeds = state.world.entities.player.inventory[3].quantity;

  const result = buyItem(state, "player", "turnip_seeds", 1);

  assert.equal(result.code, "ITEM_BOUGHT");
  assert.equal(state.money, startingMoney - 5);
  assert.equal(state.world.entities.player.inventory[3].quantity, startingSeeds + 1);
});

test("selling produce and logs adds their configured value to shared money", () => {
  const state = createGameState();
  state.world.entities.player.inventory[4] = { itemId: "turnip", quantity: 1 };
  state.world.entities.robot.inventory[4] = { itemId: "logs", quantity: 2 };

  assert.equal(sellItem(state, "player", "turnip", 1).code, "ITEM_SOLD");
  assert.equal(sellItem(state, "robot", "logs", 2).code, "ITEM_SOLD");
  assert.equal(state.money, 125);
});

test("failed transactions do not partially mutate money or inventory", () => {
  const state = createGameState();
  state.money = 0;

  assert.equal(buyItem(state, "player", "turnip_seeds", 1).code, "NOT_ENOUGH_MONEY");
  assert.equal(sellItem(state, "player", "turnip", 1).code, "ITEM_NOT_FOUND");
  assert.equal(state.money, 0);
  assert.equal(state.world.entities.player.inventory[3].quantity, 6);
});