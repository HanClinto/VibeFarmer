import assert from "node:assert/strict";
import test from "node:test";

import { contextualActions } from "../src/adapters/browser/contextual-actions.js";
import { createFarmState } from "../src/game/farm.js";
import { inspectLocation } from "../src/game/world/inspection.js";

test("nearby actions are derived from shared inspection permissions", () => {
  const state = createFarmState();
  const player = state.world.entities.player;

  assert.deepEqual(contextualActions(state, inspectLocation), [
    { type: "storage", entityId: "chest-1", label: "Open Chest" },
    { type: "storage", entityId: "robot", label: "Open Robot Storage" },
  ]);

  player.mapId = "farmhouse";
  player.position = { x: 1, y: 3 };
  assert.deepEqual(contextualActions(state, inspectLocation), [
    { type: "sleep", entityId: "bed-player", label: "Sleep" },
  ]);

  player.mapId = "farm";
  player.position = { x: 18, y: 12 };
  assert.deepEqual(contextualActions(state, inspectLocation), [
    { type: "market", entityId: "market-corn-crate", label: "Open Market" },
  ]);
});