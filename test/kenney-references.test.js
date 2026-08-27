import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const REFERENCE_ROOT = path.resolve("assets/reference/kenney");
const CELL_WIDTH = 66;
const CELL_HEIGHT = 82;

const PACKS = Object.freeze([
  { slug: "tiny-farm", sheet: "tilemap", columns: 12, rows: 11 },
  { slug: "tiny-town", sheet: "tilemap", columns: 12, rows: 11 },
  { slug: "tiny-dungeon", sheet: "tilemap", columns: 12, rows: 11 },
  { slug: "tiny-battle", sheet: "tilemap", columns: 18, rows: 11 },
  { slug: "roguelike-indoors", sheet: "spritesheet", columns: 27, rows: 18 },
  { slug: "roguelike-rpg-pack", sheet: "spritesheet", columns: 57, rows: 31 },
  { slug: "rpg-urban-pack", sheet: "tilemap", columns: 27, rows: 18 },
]);

function pngDimensions(filePath) {
  const header = readFileSync(filePath).subarray(0, 24);
  assert.deepEqual([...header.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

test("labeled Kenney sheets preserve original row and column counts", () => {
  for (const pack of PACKS) {
    const annotated = path.join(
      REFERENCE_ROOT,
      pack.slug,
      "annotated",
      `${pack.sheet}-labeled.png`,
    );
    assert.deepEqual(pngDimensions(annotated), {
      width: pack.columns * CELL_WIDTH,
      height: pack.rows * CELL_HEIGHT,
    }, pack.slug);
  }
});