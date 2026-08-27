import assert from "node:assert/strict";
import test from "node:test";

import { addItem, removeItem } from "../src/game/world/entities/containers/inventory.js";

test("inventory helpers stack and remove items deterministically", () => {
  const inventory = [null, null, null];

  assert.equal(addItem(inventory, "logs", 3), true);
  assert.deepEqual(inventory[0], { itemId: "logs", quantity: 3 });
  assert.equal(addItem(inventory, "logs", 2), true);
  assert.deepEqual(inventory[0], { itemId: "logs", quantity: 5 });
  assert.equal(removeItem(inventory, "logs", 4), true);
  assert.deepEqual(inventory[0], { itemId: "logs", quantity: 1 });
  assert.equal(removeItem(inventory, "logs", 2), false);
});

test("non-stackable tools occupy separate slots", () => {
  const inventory = [{ itemId: "hoe", quantity: 1 }, null, null];

  assert.equal(addItem(inventory, "hoe", 1), true);
  assert.deepEqual(inventory, [
    { itemId: "hoe", quantity: 1 },
    { itemId: "hoe", quantity: 1 },
    null,
  ]);
});