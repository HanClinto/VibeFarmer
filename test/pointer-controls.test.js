import assert from "node:assert/strict";
import test from "node:test";

import {
  actionForCanvasClick,
  actionTargetForPointer,
} from "../src/adapters/browser/pointer-controls.js";
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

test("pointer direction selects one adjacent keyboard action tile", () => {
  const player = {
    mapId: "farm",
    position: { x: 5, y: 5 },
    facing: "south",
  };

  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 11, y: 7 }), {
    mapId: "farm", x: 6, y: 5,
  });
  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 4, y: 0 }), {
    mapId: "farm", x: 5, y: 4,
  });
  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 5, y: 5 }), {
    mapId: "farm", x: 5, y: 6,
  });
  assert.equal(actionTargetForPointer(player, { mapId: "farmhouse", x: 5, y: 5 }), null);
});