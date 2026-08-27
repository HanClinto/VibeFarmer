import assert from "node:assert/strict";
import test from "node:test";

import { actionForCanvasClick } from "../src/adapters/browser/pointer-controls.js";
import { createFarmState } from "../src/game/farm.js";

test("ordinary portal clicks move while other occupied tiles inspect", () => {
  const state = createFarmState();

  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 3, y: 4 }), {
    kind: "submit",
    command: {
      type: "move_to",
      actorId: "player",
      target: { mapId: "farm", x: 3, y: 4 },
      item: undefined,
    },
  });
  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 4, y: 5 }), {
    kind: "inspect",
    target: { mapId: "farm", x: 4, y: 5 },
  });
});

test("Shift-click keeps interaction semantics on occupied tiles", () => {
  const state = createFarmState();
  const target = { mapId: "farm", x: 20, y: 2 };

  assert.deepEqual(actionForCanvasClick(state, target, { shiftKey: true }), {
    kind: "submit",
    command: {
      type: "interact_at",
      actorId: "player",
      target,
      item: undefined,
    },
  });
});