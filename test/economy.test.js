import assert from "node:assert/strict";
import test from "node:test";

import { buyItem, sellItem } from "../src/game/actions/actions.js";
import { createFarmState } from "../src/game/farm.js";
import { CROP_TYPES } from "../src/game/world/entities/plants/crop-types.js";
import { ITEM_TYPES } from "../src/game/world/entities/items/item-types.js";
import { marketListings } from "../src/adapters/browser/market.js";

function createMarketState() {
  const state = createFarmState();
  state.world.entities.player.position = { x: 18, y: 12 };
  state.world.entities.robot.position = { x: 19, y: 12 };
  return state;
}

test("buying seeds spends shared money and adds inventory", () => {
  const state = createMarketState();
  const startingMoney = state.money;
  const startingSeeds = state.world.entities.player.inventory[3].quantity;

  const result = buyItem(state, "player", "turnip_seeds", 1);

  assert.equal(result.code, "ITEM_BOUGHT");
  assert.equal(state.money, startingMoney - 5);
  assert.equal(state.world.entities.player.inventory[3].quantity, startingSeeds + 1);
});

test("selling produce and logs adds their configured value to shared money", () => {
  const state = createMarketState();
  state.world.entities.player.inventory[4] = { itemId: "turnip", quantity: 1 };
  state.world.entities.robot.inventory[4] = { itemId: "logs", quantity: 2 };

  assert.equal(sellItem(state, "player", "turnip", 1).code, "ITEM_SOLD");
  assert.equal(sellItem(state, "robot", "logs", 2).code, "ITEM_SOLD");
  assert.equal(state.money, 125);
});

test("failed transactions do not partially mutate money or inventory", () => {
  const state = createMarketState();
  state.money = 0;

  assert.equal(buyItem(state, "player", "turnip_seeds", 1).code, "NOT_ENOUGH_MONEY");
  assert.equal(sellItem(state, "player", "turnip", 1).code, "ITEM_NOT_FOUND");
  assert.equal(state.money, 0);
  assert.equal(state.world.entities.player.inventory[3].quantity, 6);
});

test("both farmhands are rejected when they try to trade away from the market", () => {
  const state = createFarmState();

  assert.equal(
    buyItem(state, "player", "turnip_seeds", 1).code,
    "MARKET_NOT_ADJACENT",
  );
  assert.equal(sellItem(state, "robot", "logs", 1).code, "MARKET_NOT_ADJACENT");
});

test("market listings include every configured crop seed and produce item", () => {
  const listings = marketListings(ITEM_TYPES);
  assert.deepEqual(
    new Set(listings.buy.map((item) => item.id)),
    new Set(Object.values(CROP_TYPES).map((crop) => crop.seedItemId)),
  );
  assert.ok(Object.values(CROP_TYPES).every(
    (crop) => listings.sell.some((item) => item.id === crop.produceItemId),
  ));
});