import assert from "node:assert/strict";
import test from "node:test";

import { clampWindowPosition } from "../src/adapters/browser/draggable-windows.js";

test("draggable windows are clamped within the viewport", () => {
  const windowSize = { width: 220, height: 180 };
  const viewportSize = { width: 800, height: 600 };

  assert.deepEqual(
    clampWindowPosition({ x: -40, y: -20 }, windowSize, viewportSize),
    { x: 0, y: 0 },
  );
  assert.deepEqual(
    clampWindowPosition({ x: 750, y: 560 }, windowSize, viewportSize),
    { x: 580, y: 420 },
  );
  assert.deepEqual(
    clampWindowPosition({ x: 240, y: 160 }, windowSize, viewportSize),
    { x: 240, y: 160 },
  );
});