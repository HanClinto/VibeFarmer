import assert from "node:assert/strict";
import test from "node:test";

import { jsonTokens } from "../src/adapters/browser/json-view.js";

test("JSON display tokens distinguish values without interpreting string contents", () => {
  const value = {
    message: "true <script>alert(1)</script>",
    quantity: 12,
    available: true,
    optional: null,
  };
  const tokens = jsonTokens(value);
  const highlighted = tokens.filter((token) => token.type !== "plain");

  assert.deepEqual(highlighted.map((token) => token.type), [
    "key",
    "string",
    "key",
    "number",
    "key",
    "boolean",
    "key",
    "null",
  ]);
  assert.equal(tokens.map((token) => token.text).join(""), JSON.stringify(value, null, 2));
});