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
  assert.equal(actionFailureMessage("UNKNOWN_ERROR"), "Cannot act: UNKNOWN_ERROR");
});

test("robot stamina failures point to robot charging options", () => {
  assert.equal(
    actionFailureMessage("NOT_ENOUGH_STAMINA", "robot"),
    "Robot is out of stamina. Use its charging berth or a solar charging station.",
  );
});

test("common invalid targets explain how the selected item works", () => {
  assert.equal(actionFailureMessage("INVALID_AXE_TARGET"), "The axe can only chop trees.");
  assert.equal(
    actionFailureMessage("INVALID_HOE_TARGET"),
    "Use the hoe on grass to till it, or on a crop to remove it.",
  );
  assert.equal(
    actionFailureMessage("INVALID_WATER_TARGET"),
    "The watering can works on dry tilled soil.",
  );
  assert.equal(
    actionFailureMessage("INVALID_PLANT_TARGET"),
    "Seeds need an empty tilled soil tile.",
  );
});