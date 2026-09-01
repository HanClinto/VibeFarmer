import assert from "node:assert/strict";
import test from "node:test";

import { canvasSizeForStage } from "../src/adapters/browser/game-window.js";

const minimumSize = { width: 576, height: 480 };

test("game canvas follows expansion without shrinking below its default size", () => {
  assert.deepEqual(canvasSizeForStage({ width: 576, height: 480 }, minimumSize), {
    width: 576,
    height: 480,
  });
  assert.deepEqual(canvasSizeForStage({ width: 864.4, height: 684.4 }, minimumSize), {
    width: 864,
    height: 684,
  });
  assert.deepEqual(canvasSizeForStage({ width: 300, height: 240 }, minimumSize), {
    width: 576,
    height: 480,
  });
});