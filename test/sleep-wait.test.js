import assert from "node:assert/strict";
import test from "node:test";

import { createSleepWaitFlow } from "../src/adapters/browser/sleep-wait.js";

function harness() {
  let callback = null;
  let continuing = true;
  const events = [];
  const flow = createSleepWaitFlow({
    setTimer(nextCallback, delay) {
      callback = nextCallback;
      events.push(`timer:${delay}`);
      return 1;
    },
    clearTimer() {
      callback = null;
      events.push("timer:cleared");
    },
    shouldContinue: () => continuing,
    onWaiting: () => events.push("waiting"),
    onPrompt: () => events.push("prompt"),
    onClear: () => events.push("clear"),
  });
  return {
    flow,
    events,
    fireTimer: () => callback?.(),
    stopWaiting: () => { continuing = false; },
  };
}

test("sleep waiting dims immediately and prompts after the configured delay", () => {
  const state = harness();

  state.flow.begin();
  assert.deepEqual(state.events, ["waiting", "timer:2500"]);
  state.fireTimer();
  assert.deepEqual(state.events, ["waiting", "timer:2500", "prompt"]);
});

test("sleep waiting clears without a stale prompt when readiness changes", () => {
  const state = harness();

  state.flow.begin();
  state.stopWaiting();
  state.flow.sync();
  state.fireTimer();

  assert.deepEqual(state.events, [
    "waiting",
    "timer:2500",
    "timer:cleared",
    "clear",
  ]);
});