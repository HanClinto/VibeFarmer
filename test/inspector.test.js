import assert from "node:assert/strict";
import test from "node:test";

import { nextTabIndex, operationSummary } from "../src/adapters/browser/inspector.js";

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