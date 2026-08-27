import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import {
  STORAGE_KEY,
  createPersistence,
  restoreState,
  serializeState,
} from "../src/adapters/browser/persistence.js";
import { createGameState } from "../src/game/state.js";

function createMemoryStorage() {
  const values = new Map();
  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
    removeItem(key) {
      values.delete(key);
    },
  };
}

test("versioned state round-trips without changing completed world state", () => {
  const state = createGameState();
  state.day = 3;
  state.money = 145;
  state.world.terrain[2][2] = "tilled";

  const restored = restoreState(serializeState(state));

  assert.equal(restored.state.day, 3);
  assert.equal(restored.state.money, 145);
  assert.equal(restored.state.world.terrain[2][2], "tilled");
  assert.deepEqual(restored.interruptedOperationIds, []);
});

test("active operations are interrupted on restore without replaying movement", () => {
  const controller = createController(createGameState());
  const submission = controller.submit({
    type: "move_to",
    actorId: "player",
    target: { x: 1, y: 3 },
  });
  controller.tick();
  const positionAtSave = { ...controller.getSnapshot().world.entities.player.position };

  const restored = restoreState(serializeState(controller.getSnapshot()));
  const operation = restored.state.operations[submission.operationId];

  assert.equal(operation.status, "cancelled");
  assert.equal(operation.result.code, "OPERATION_INTERRUPTED_RELOAD");
  assert.equal(restored.state.world.entities.player.activeIntent, null);
  assert.equal(restored.state.world.entities.player.motion, null);
  assert.deepEqual(restored.state.world.entities.player.position, positionAtSave);
});

test("corrupt saves are removed and safely fall back", () => {
  const storage = createMemoryStorage();
  storage.setItem(STORAGE_KEY, "not-json");
  const persistence = createPersistence(storage);

  assert.deepEqual(persistence.load(), { state: null, code: "SAVE_CORRUPT" });
  assert.equal(storage.getItem(STORAGE_KEY), null);
});

test("coalesced autosave writes the latest state without postponing indefinitely", () => {
  const storage = createMemoryStorage();
  let callback = null;
  let timerCount = 0;
  const persistence = createPersistence(storage, {
    setTimer(nextCallback) {
      callback = nextCallback;
      timerCount += 1;
      return 1;
    },
    clearTimer() {},
  });
  const state = createGameState();
  persistence.scheduleSave(state);
  state.money = 77;
  persistence.scheduleSave(state);
  assert.equal(timerCount, 1);
  callback();

  assert.equal(restoreState(storage.getItem(STORAGE_KEY)).state.money, 77);
});