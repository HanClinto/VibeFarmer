import assert from "node:assert/strict";
import test from "node:test";

import { createRuntime } from "../src/adapters/browser/runtime.js";

function withFakeAnimationFrame(runTest) {
  const originalRequest = globalThis.requestAnimationFrame;
  const originalCancel = globalThis.cancelAnimationFrame;
  let nextId = 1;
  const callbacks = new Map();
  globalThis.requestAnimationFrame = (callback) => {
    const id = nextId;
    nextId += 1;
    callbacks.set(id, callback);
    return id;
  };
  globalThis.cancelAnimationFrame = (id) => callbacks.delete(id);

  const runFrame = (now) => {
    const entry = callbacks.entries().next().value;
    assert.ok(entry, "expected a scheduled animation frame");
    const [id, callback] = entry;
    callbacks.delete(id);
    callback(now);
  };

  try {
    runTest({ runFrame, callbacks });
  } finally {
    globalThis.requestAnimationFrame = originalRequest;
    globalThis.cancelAnimationFrame = originalCancel;
  }
}

function fakeController() {
  return {
    tickCount: 0,
    ticksEnabled: [],
    tick(count) {
      this.tickCount += count;
    },
    setTicksEnabled(enabled) {
      this.ticksEnabled.push(enabled);
    },
    getSnapshot() {
      return { tick: this.tickCount };
    },
  };
}

test("runtime applies speed multipliers and pause without accumulating wall time", () => {
  withFakeAnimationFrame(({ runFrame }) => {
    const controller = fakeController();
    const runtime = createRuntime(controller);
    runtime.start();
    runFrame(0);
    runFrame(200);
    assert.equal(controller.tickCount, 1);

    runtime.setSpeed(2);
    runFrame(300);
    assert.equal(controller.tickCount, 2);
    runtime.setSpeed(0);
    runFrame(2300);
    assert.equal(controller.tickCount, 2);
    runtime.setSpeed(1);
    runFrame(2500);
    assert.equal(controller.tickCount, 3);
    assert.deepEqual(controller.ticksEnabled, [true, false, true]);
  });
});

test("runtime bounds catch-up and stop cancels the scheduled frame", () => {
  withFakeAnimationFrame(({ runFrame, callbacks }) => {
    const controller = fakeController();
    const runtime = createRuntime(controller);
    runtime.start();
    runFrame(0);
    runFrame(10000);
    assert.equal(controller.tickCount, 15);

    runtime.setSpeed(10);
    runFrame(20000);
    assert.equal(controller.tickCount, 165);
    runtime.stop();
    assert.equal(callbacks.size, 0);

    runtime.start();
    runFrame(50000);
    assert.equal(controller.tickCount, 165);
  });
});

test("runtime rejects unsupported speed values", () => {
  const runtime = createRuntime(fakeController());
  assert.throws(() => runtime.setSpeed(3), /Unsupported game speed/);
});