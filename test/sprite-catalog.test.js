import assert from "node:assert/strict";
import test from "node:test";

import { loadSpriteCatalog } from "../src/adapters/browser/sprite-catalog.js";

function fakeImage() {
  const listeners = {};
  return {
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    set src(value) {
      this.url = value;
      queueMicrotask(() => listeners.load());
    },
  };
}

test("sprite catalog preloads every declared frame", async () => {
  const catalog = await loadSpriteCatalog({
    fetchCatalog: async () => ({
      frames: {
        "terrain.grass": { file: "kenney/tiny-town/grass.png" },
        "entity.tree": { file: "kenney/tiny-farm/tree.png" },
      },
    }),
    imageFactory: fakeImage,
  });

  assert.deepEqual(Object.keys(catalog.frames), ["terrain.grass", "entity.tree"]);
  assert.match(catalog.frames["terrain.grass"].url, /assets\/game\/kenney\/tiny-town\/grass\.png/);
});