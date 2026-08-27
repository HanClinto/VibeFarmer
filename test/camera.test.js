import assert from "node:assert/strict";
import test from "node:test";

import { computeCamera, screenToWorld } from "../src/adapters/browser/camera.js";

const baseCamera = {
  worldWidth: 24,
  worldHeight: 18,
  viewportWidth: 576,
  viewportHeight: 480,
  tileSize: 48,
};

test("camera centers on the player and clamps at map edges", () => {
  assert.deepEqual(computeCamera({ ...baseCamera, focus: { x: 12, y: 9 } }), {
    x: 312,
    y: 216,
  });
  assert.deepEqual(computeCamera({ ...baseCamera, focus: { x: 0, y: 0 } }), { x: 0, y: 0 });
  assert.deepEqual(computeCamera({ ...baseCamera, focus: { x: 23, y: 17 } }), {
    x: 576,
    y: 384,
  });
});

test("maps no larger than the viewport retain a zero camera", () => {
  assert.deepEqual(computeCamera({
    ...baseCamera,
    focus: { x: 6, y: 5 },
    worldWidth: 12,
    worldHeight: 10,
  }), { x: 0, y: 0 });
});

test("pointer coordinates convert through display scale and camera offset", () => {
  assert.deepEqual(screenToWorld({
    screenX: 144,
    screenY: 120,
    displayWidth: 288,
    displayHeight: 240,
    canvasWidth: 576,
    canvasHeight: 480,
    camera: { x: 288, y: 192 },
    tileSize: 48,
  }), { x: 12, y: 9 });
});