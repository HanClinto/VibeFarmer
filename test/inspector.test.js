import assert from "node:assert/strict";
import test from "node:test";

import {
  nextTabIndex,
  operationSummary,
  robotOverview,
} from "../src/adapters/browser/inspector.js";
import { createGameState } from "../src/game/state.js";

test("Inspector tab keys move and wrap roving focus", () => {
  assert.equal(nextTabIndex("ArrowRight", 3, 4), 0);
  assert.equal(nextTabIndex("ArrowLeft", 0, 4), 3);
  assert.equal(nextTabIndex("Home", 2, 4), 0);
  assert.equal(nextTabIndex("End", 1, 4), 3);
  assert.equal(nextTabIndex("Enter", 2, 4), 2);
});

test("operation summaries expose identity, command, state, and elapsed ticks", () => {
  assert.equal(operationSummary({
    operationId: "operation-3",
    actorId: "robot",
    command: { type: "interact_at" },
    status: "waiting_for_ticks",
    submittedTick: 12,
    completedTick: null,
  }, 17), "operation-3 · robot · interact_at · waiting_for_ticks · 5 ticks");
  assert.equal(operationSummary({
    operationId: "operation-4",
    actorId: "player",
    command: { type: "move_to" },
    status: "completed",
    submittedTick: 20,
    completedTick: 23,
  }, 40), "operation-4 · player · move_to · completed · 3 ticks");
});

test("robot overview exposes a friendly ten-slot inventory and task state", () => {
  const state = createGameState();
  const view = robotOverview(state);
  assert.equal(view.status, "Sleeping");
  assert.equal(view.location, "(2, 1)");
  assert.equal(view.stamina, "20");
  assert.equal(view.inventory.length, 10);
  assert.deepEqual(view.inventory[0], {
    slot: 1,
    itemId: "axe",
    quantity: 1,
    selected: true,
  });
  assert.deepEqual(view.inventory[9], {
    slot: 10,
    itemId: null,
    quantity: 0,
    selected: false,
  });
});