import assert from "node:assert/strict";
import test from "node:test";

import {
  commandForGameplayKey,
  createHeldMovementController,
} from "../src/adapters/browser/keyboard-controls.js";

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

test("holding one movement key submits one step at a time", async () => {
  const currentPlayer = player();
  const submissions = [];
  const resolvers = [];
  const heldMovement = createHeldMovementController({
    getPlayer: () => currentPlayer,
    submit(command) {
      submissions.push(command);
      const completion = new Promise((resolve) => resolvers.push(resolve));
      return { success: true, completion };
    },
  });

  heldMovement.press("d");
  heldMovement.press("d");
  assert.equal(submissions.length, 1);
  assert.deepEqual(submissions[0].target, { x: 5, y: 3 });

  currentPlayer.position = { x: 5, y: 3 };
  resolvers.shift()({ success: true });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(submissions.length, 2);
  assert.deepEqual(submissions[1].target, { x: 6, y: 3 });

  heldMovement.release("d");
  resolvers.shift()({ success: true });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(submissions.length, 2);
});

test("a fresh direction replaces movement already in flight", async () => {
  const currentPlayer = player();
  const submissions = [];
  const replacements = [];
  const resolvers = [];
  function resultFor(command, commands) {
    commands.push(command);
    const completion = new Promise((resolve) => resolvers.push(resolve));
    return { success: true, completion };
  }
  const heldMovement = createHeldMovementController({
    getPlayer: () => currentPlayer,
    submit: (command) => resultFor(command, submissions),
    replace: (command) => resultFor(command, replacements),
  });

  heldMovement.press("d");
  heldMovement.press("d");
  heldMovement.press("w");

  assert.equal(submissions.length, 0);
  assert.deepEqual(replacements.map(({ target }) => target), [
    { x: 5, y: 3 },
    { x: 4, y: 2 },
  ]);

  currentPlayer.position = { x: 4, y: 2 };
  resolvers.at(-1)({ success: true });
  await Promise.resolve();
  await Promise.resolve();
  assert.equal(submissions.length, 1);
  assert.deepEqual(submissions[0].target, { x: 4, y: 1 });
});
