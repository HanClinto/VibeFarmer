import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { createGameState } from "../src/game/state.js";

test("headless game and controller load without browser globals", async () => {
  assert.equal(typeof document, "undefined");
  assert.equal(typeof window, "undefined");

  const controller = createController(createGameState());
  const submission = controller.submit({
    type: "move_to",
    actorId: "player",
    target: { x: 1, y: 2 },
  });

  assert.equal(submission.success, true);
  controller.tick(2);
  assert.equal((await submission.completion).code, "DESTINATION_REACHED");
  assert.deepEqual(controller.getSnapshot().world.entities.player.position, { x: 1, y: 2 });
});

test("the world is the sole owner of actors and placed entities", () => {
  const state = createGameState();

  assert.equal("actors" in state, false);
  assert.equal(state.world.entities.player.type, "actor");
  assert.equal(state.world.entities.robot.type, "actor");
  assert.deepEqual(state.world.entities.player.position, { x: 1, y: 1 });
});

test("browser-style input and robot commands use the same controller", async () => {
  const controller = createController(createGameState());
  const events = [];
  const unsubscribe = controller.subscribe((event) => events.push(event.result.code));

  assert.equal(controller.execute({
    type: "select_slot",
    actorId: "player",
    slot: 2,
  }).code, "SLOT_SELECTED");
  const submission = controller.submit({
    type: "move_to",
    actorId: "robot",
    target: { x: 2, y: 2 },
  });
  controller.tick(2);
  assert.equal((await submission.completion).code, "DESTINATION_REACHED");

  unsubscribe();
  assert.deepEqual(events, ["SLOT_SELECTED", "INTENT_SUBMITTED", "TICK_COMPLETE"]);
});

test("completion waits for ticks and cancellation settles at a tick boundary", async () => {
  const controller = createController(createGameState());
  const submission = controller.submit({
    type: "move_to",
    actorId: "robot",
    target: { x: 2, y: 3 },
  });
  let settled = false;
  submission.completion.then(() => {
    settled = true;
  });

  await Promise.resolve();
  assert.equal(settled, false);
  assert.equal(controller.getSnapshot().operations[submission.operationId].status, "running");

  assert.equal(controller.cancel(submission.operationId).code, "CANCELLATION_REQUESTED");
  assert.equal(controller.getSnapshot().operations[submission.operationId].status, "running");
  controller.tick();

  const result = await submission.completion;
  assert.equal(result.code, "INTENT_CANCELLED");
  assert.equal(controller.getSnapshot().operations[submission.operationId].status, "cancelled");
  assert.equal(controller.getSnapshot().world.entities.robot.activeIntent, null);
});

test("paused submissions wait visibly without advancing until ticks resume", async () => {
  const controller = createController(createGameState());
  controller.setTicksEnabled(false);
  const submission = controller.submit({
    type: "move_to",
    actorId: "robot",
    target: { x: 2, y: 2 },
  });

  assert.equal(
    controller.getSnapshot().operations[submission.operationId].status,
    "waiting_for_ticks",
  );
  assert.equal(controller.tick().code, "TICKS_PAUSED");
  assert.equal(controller.getSnapshot().tick, 0);

  controller.setTicksEnabled(true);
  assert.equal(controller.getSnapshot().operations[submission.operationId].status, "running");
  controller.tick(2);
  assert.equal((await submission.completion).code, "DESTINATION_REACHED");
});

test("controller records comparable player and robot command submissions", () => {
  const controller = createController(createGameState());
  controller.execute({
    type: "select_slot",
    actorId: "player",
    source: "human-ui",
    slot: 2,
  });
  controller.submit({
    type: "move_to",
    actorId: "robot",
    source: "webmcp",
    target: { x: 2, y: 2 },
  });

  const commands = controller.getSnapshot().history.filter(
    (event) => event.type === "command_submitted",
  );
  assert.deepEqual(commands.map(({ actorId, source, command }) => ({
    actorId,
    source,
    type: command.type,
    target: command.target,
  })), [
    { actorId: "player", source: "human-ui", type: "select_slot", target: undefined },
    { actorId: "robot", source: "webmcp", type: "move_to", target: { x: 2, y: 2 } },
  ]);
});