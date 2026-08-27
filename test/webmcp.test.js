import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { registerWebMcp } from "../src/adapters/webmcp/adapter.js";
import { createWebMcpTools, inspectGame } from "../src/adapters/webmcp/tools.js";
import { createGameState } from "../src/game/state.js";

function toolByName(tools, name) {
  return tools.find((tool) => tool.name === name);
}

function tickUntilIdle(controller, actorId = "robot", limit = 100) {
  let ticks = 0;
  while (controller.getSnapshot().world.entities[actorId].activeIntent) {
    assert.ok(ticks < limit, "tool operation did not finish");
    controller.tick();
    ticks += 1;
  }
}

test("registerWebMcp registers the compact primitive surface", async () => {
  const registered = [];
  const modelContext = {
    registerTool(tool, options) {
      registered.push({ tool, options });
      return Promise.resolve();
    },
  };

  const registration = await registerWebMcp(
    modelContext,
    createController(createGameState()),
  );
  const names = registered.map(({ tool }) => tool.name);

  assert.equal(registration.supported, true);
  assert.deepEqual(names, [
    "inspect_game",
    "move_to",
    "interact_at",
    "select_slot",
    "buy_item",
    "sell_item",
    "transfer_item",
    "sleep",
    "cancel_operation",
  ]);
  assert.equal(names.some((name) => /plan|all|batch/.test(name)), false);
  assert.ok(registered.every(({ options }) => options.signal instanceof AbortSignal));
});

test("unsupported browsers retain locally invokable tool definitions", async () => {
  const registration = await registerWebMcp(null, createController(createGameState()));
  assert.equal(registration.supported, false);
  assert.equal(registration.tools.length, 9);
});

test("inspection exposes robot inventory but not player inventory", () => {
  const inspected = inspectGame(createController(createGameState()));
  const player = inspected.entities.find((entity) => entity.id === "player");
  const robot = inspected.entities.find((entity) => entity.id === "robot");

  assert.equal("inventory" in player, false);
  assert.ok(Array.isArray(robot.inventory));
});

test("move_to stays pending until simulation ticks complete", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const promise = toolByName(tools, "move_to").execute(
    { x: 2, y: 3 },
    { signal: new AbortController().signal },
  );
  let settled = false;
  promise.then(() => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(settled, false);

  tickUntilIdle(controller);
  const result = await promise;
  assert.equal(result.code, "DESTINATION_REACHED");
  assert.ok(result.completedTick > result.submittedTick);
});

test("tool abort requests cancellation and resolves with a structured result", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const abortController = new AbortController();
  const promise = toolByName(tools, "move_to").execute(
    { x: 2, y: 4 },
    { signal: abortController.signal },
  );

  abortController.abort();
  controller.tick();
  const result = await promise;
  assert.equal(result.code, "INTENT_CANCELLED");
});

test("invocation observer receives running and completed records", async () => {
  const records = [];
  const tools = createWebMcpTools(createController(createGameState()), {
    onInvocation(record) {
      records.push(record);
    },
  });

  await toolByName(tools, "inspect_game").execute({ includeHistory: false });

  assert.deepEqual(records.map((record) => record.status), ["running", "completed"]);
  assert.equal(records[0].invocationId, records[1].invocationId);
  assert.equal(records[1].output.code, "GAME_INSPECTED");
});