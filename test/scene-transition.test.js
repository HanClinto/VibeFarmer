import assert from "node:assert/strict";
import test from "node:test";

import { createSceneTransition } from "../src/adapters/browser/scene-transition.js";

function fakeElement() {
  const classes = new Set();
  const label = { textContent: "" };
  return {
    hidden: true,
    dataset: {},
    classList: {
      add: (name) => classes.add(name),
      remove: (...names) => names.forEach((name) => classes.delete(name)),
      contains: (name) => classes.has(name),
    },
    querySelector: () => label,
    label,
  };
}

function immediateOptions() {
  return {
    setTimer(callback) { callback(); },
    nextFrame(callback) { callback(); },
    reducedMotion: true,
  };
}

test("map transitions fade through and then clear", async () => {
  const element = fakeElement();
  const transition = createSceneTransition(element, immediateOptions());

  await transition.playMapChange("Farmhouse");

  assert.equal(element.label.textContent, "Farmhouse");
  assert.equal(element.dataset.mode, "map");
  assert.equal(element.classList.contains("is-opaque"), false);
  assert.equal(element.hidden, true);
});

test("night holds until the morning transition completes", async () => {
  const element = fakeElement();
  const transition = createSceneTransition(element, immediateOptions());

  await transition.beginNight();
  assert.equal(element.label.textContent, "Night falls");
  assert.equal(element.classList.contains("is-opaque"), true);
  assert.equal(element.hidden, false);

  await transition.wake();
  assert.equal(element.label.textContent, "Good morning");
  assert.equal(element.classList.contains("is-opaque"), false);
  assert.equal(element.hidden, true);
});

test("sleep waiting dims until cleared without clearing a later night", async () => {
  const element = fakeElement();
  const transition = createSceneTransition(element, immediateOptions());

  transition.beginWaiting();
  assert.equal(element.label.textContent, "Waiting for robot...");
  assert.equal(element.dataset.mode, "waiting");
  assert.equal(element.classList.contains("is-dimmed"), true);

  transition.clearWaiting();
  assert.equal(element.classList.contains("is-dimmed"), false);
  assert.equal(element.hidden, true);

  await transition.beginNight();
  transition.clearWaiting();
  assert.equal(element.dataset.mode, "night");
  assert.equal(element.classList.contains("is-opaque"), true);
  assert.equal(element.hidden, false);
});