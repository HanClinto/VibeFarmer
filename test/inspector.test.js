import assert from "node:assert/strict";
import test from "node:test";

import { nextTabIndex } from "../src/adapters/browser/inspector.js";

test("Inspector tab keys move and wrap roving focus", () => {
  assert.equal(nextTabIndex("ArrowRight", 3, 4), 0);
  assert.equal(nextTabIndex("ArrowLeft", 0, 4), 3);
  assert.equal(nextTabIndex("Home", 2, 4), 0);
  assert.equal(nextTabIndex("End", 1, 4), 3);
  assert.equal(nextTabIndex("Enter", 2, 4), 2);
});