import assert from "node:assert/strict";
import test from "node:test";

import { commandForGameplayKey } from "../src/adapters/browser/keyboard-controls.js";

function player(overrides = {}) {
  return {
    id: "player",
    position: { x: 4, y: 3 },
    facing: "south",
    selectedSlot: 1,
    inventory: [{ itemId: "axe", quantity: 1 }, null],
    ...overrides,
  };
}

test("arrow and WASD keys map to one adjacent shared move intent", () => {
  assert.deepEqual(commandForGameplayKey("ArrowUp", player()), {
    type: "move_to",
    actorId: "player",
    target: { x: 4, y: 2 },
  });
  assert.deepEqual(commandForGameplayKey("d", player()), {
    type: "move_to",
    actorId: "player",
    target: { x: 5, y: 3 },
  });
});

test("Space and E interact with the faced tile using the selected slot", () => {
  assert.deepEqual(commandForGameplayKey("e", player({ facing: "west" })), {
    type: "interact_at",
    actorId: "player",
    target: { x: 3, y: 3 },
    item: undefined,
  });
  assert.deepEqual(commandForGameplayKey(" ", player({ selectedSlot: 2 })), {
    type: "interact_at",
    actorId: "player",
    target: { x: 4, y: 4 },
    item: { action: "harvest" },
  });
});

test("unrelated keys do not create gameplay commands", () => {
  assert.equal(commandForGameplayKey("Tab", player()), null);
});