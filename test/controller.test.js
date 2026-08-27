import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { createGameState } from "../src/game/state.js";

test("headless game and controller load without browser globals", () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");

  const controller = createController(createGameState());
  const result = controller.execute({
    type: "move_to",
    actorId: "player",
    target: { x: 1, y: 2 },
  });

  assert.equal(result.success, true);
  assert.deepEqual(controller.getSnapshot().actors.player.position, { x: 1, y: 2 });
});

test("browser-style input and robot commands use the same controller", () => {
  const controller = createController(createGameState());
  const events = [];
  const unsubscribe = controller.subscribe((event) => events.push(event.result.code));

  assert.equal(controller.execute({
    type: "select_slot",
    actorId: "player",
    slot: 2,
  }).code, "SLOT_SELECTED");
  assert.equal(controller.execute({
    type: "move_to",
    actorId: "robot",
    target: { x: 2, y: 2 },
  }).code, "DESTINATION_REACHED");

  unsubscribe();
  assert.deepEqual(events, ["SLOT_SELECTED", "DESTINATION_REACHED"]);
});