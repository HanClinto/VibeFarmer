import assert from "node:assert/strict";
import test from "node:test";

import { actionFailureMessage } from "../src/adapters/browser/action-feedback.js";

test("stamina failures tell the player how to recover", () => {
  assert.equal(
    actionFailureMessage("NOT_ENOUGH_STAMINA"),
    "Too tired to work. Go home and sleep in your bed.",
  );
});

test("other action failures retain their diagnostic code", () => {
  assert.equal(actionFailureMessage("INVALID_AXE_TARGET"), "Cannot act: INVALID_AXE_TARGET");
});

test("robot stamina failures point to robot charging options", () => {
  assert.equal(
    actionFailureMessage("NOT_ENOUGH_STAMINA", "robot"),
    "Robot is out of stamina. Use its charging berth or a solar charging station.",
  );
});