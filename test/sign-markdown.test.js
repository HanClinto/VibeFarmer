import assert from "node:assert/strict";
import test from "node:test";

import { parseSignMarkdown } from "../src/adapters/browser/sign-markdown.js";

test("sign Markdown parses headings, paragraphs, and lists without accepting raw HTML", () => {
  assert.deepEqual(parseSignMarkdown([
    "# Farm Notes",
    "",
    "Use **good tools** and <script>bad()</script>.",
    "",
    "- Plant seeds",
    "- Water crops",
  ].join("\n")), [
    { type: "heading", level: 1, text: "Farm Notes" },
    { type: "paragraph", text: "Use **good tools** and <script>bad()</script>." },
    { type: "list", items: ["Plant seeds", "Water crops"] },
  ]);
});