import assert from "node:assert/strict";
import test from "node:test";

import { audioCueForEvent, createGameAudio } from "../src/adapters/browser/audio.js";

test("domain events map to restrained game audio cues", () => {
  assert.equal(audioCueForEvent({ type: "crop_harvested" }), "harvest");
  assert.equal(audioCueForEvent({ type: "use_item", itemId: "watering_can" }), "water");
  assert.equal(audioCueForEvent({ type: "use_item", itemId: "axe" }), "chop");
  assert.equal(audioCueForEvent({ type: "portal_travel" }), "portal");
  assert.equal(audioCueForEvent({ type: "day_begin" }), "morning");
  assert.equal(audioCueForEvent({ type: "move" }), null);
});

test("audio is opt-in and schedules cues only while enabled", () => {
  const starts = [];
  const context = {
    state: "running",
    currentTime: 1,
    destination: {},
    createOscillator() {
      return {
        frequency: { setValueAtTime() {} },
        connect() {},
        start(time) { starts.push(time); },
        stop() {},
      };
    },
    createGain() {
      return {
        gain: {
          setValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
    },
  };
  const audio = createGameAudio({ contextFactory: () => context });

  assert.equal(audio.playEvent({ type: "crop_harvested" }), false);
  audio.setEnabled(true);
  assert.equal(audio.playEvent({ type: "crop_harvested" }), true);
  assert.equal(starts.length, 3);
  audio.setEnabled(false);
  assert.equal(audio.playEvent({ type: "item_sold" }), false);
});