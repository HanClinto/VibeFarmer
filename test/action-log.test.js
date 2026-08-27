import assert from "node:assert/strict";
import test from "node:test";

import { actionSummary } from "../src/adapters/browser/action-log.js";

test("action summaries expose actor command source and clicked target", () => {
  assert.equal(actionSummary({
    type: "command_submitted",
    tick: 12,
    source: "human-ui",
    command: { type: "interact_at", target: { x: 4, y: 5 } },
  }), "[12] human-ui · interact_at → (4,5)");
  assert.equal(actionSummary({
    type: "command_submitted",
    tick: 13,
    source: "webmcp",
    command: { type: "move_to", target: { x: 8, y: 2 } },
  }), "[13] webmcp · move_to → (8,2)");
  assert.equal(actionSummary({
    type: "command_submitted",
    tick: 14,
    source: "human-ui",
    command: { type: "interact_at", target: { id: "tree-1" } },
  }), "[14] human-ui · interact_at → tree-1");
});