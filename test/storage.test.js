import assert from "node:assert/strict";
import test from "node:test";

import { transferItem } from "../src/game/actions/actions.js";
import { createGameState } from "../src/game/state.js";
import { createChest } from "../src/game/world/entities/containers/chests.js";
import { addWorldEntity } from "../src/game/world/world.js";

function createStorageState() {
  const state = createGameState();
  addWorldEntity(state.world, createChest({
    id: "chest-1",
    position: { x: 0, y: 1 },
    inventory: [{ itemId: "turnip_seeds", quantity: 3 }],
  }));
  return state;
}

test("both actors can transfer items with an adjacent chest", () => {
  const state = createStorageState();

  assert.equal(transferItem(state, "player", {
    fromEntityId: "player",
    toEntityId: "chest-1",
    itemId: "turnip_seeds",
    quantity: 2,
  }).code, "ITEM_TRANSFERRED");
  assert.equal(transferItem(state, "player", {
    fromEntityId: "chest-1",
    toEntityId: "player",
    itemId: "turnip_seeds",
    quantity: 1,
  }).code, "ITEM_TRANSFERRED");

  state.world.entities.robot.position = { x: 0, y: 0 };
  state.world.entities.robot.inventory[4] = { itemId: "logs", quantity: 2 };
  assert.equal(transferItem(state, "robot", {
    fromEntityId: "robot",
    toEntityId: "chest-1",
    itemId: "logs",
    quantity: 2,
  }).code, "ITEM_TRANSFERRED");
});

test("the player can use robot storage but the robot cannot withdraw player items", () => {
  const state = createStorageState();

  assert.equal(transferItem(state, "player", {
    fromEntityId: "player",
    toEntityId: "robot",
    itemId: "turnip_seeds",
    quantity: 2,
  }).code, "ITEM_TRANSFERRED");
  assert.equal(transferItem(state, "player", {
    fromEntityId: "robot",
    toEntityId: "player",
    itemId: "turnip_seeds",
    quantity: 1,
  }).code, "ITEM_TRANSFERRED");
  assert.equal(transferItem(state, "robot", {
    fromEntityId: "player",
    toEntityId: "robot",
    itemId: "axe",
    quantity: 1,
  }).code, "PLAYER_INVENTORY_PRIVATE");
});

test("the robot may deliver its own items into available player capacity", () => {
  const state = createStorageState();
  state.world.entities.robot.inventory[4] = { itemId: "logs", quantity: 3 };

  const result = transferItem(state, "robot", {
    fromEntityId: "robot",
    toEntityId: "player",
    itemId: "logs",
    quantity: 3,
  });

  assert.equal(result.code, "ITEM_TRANSFERRED");
  assert.equal(result.moved, 3);
  assert.ok(state.world.entities.player.inventory.some(
    (stack) => stack?.itemId === "logs" && stack.quantity === 3,
  ));
});