import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ASSET_ROOT = path.resolve("assets/game");

function pngDimensions(filePath) {
  const header = readFileSync(filePath).subarray(0, 24);
  assert.deepEqual([...header.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
  return {
    width: header.readUInt32BE(16),
    height: header.readUInt32BE(20),
  };
}

test("curated runtime art has complete CC0 provenance and native 16px dimensions", () => {
  const catalog = JSON.parse(readFileSync(path.join(ASSET_ROOT, "catalog.json"), "utf8"));
  assert.equal(catalog.tileSize, 16);
  assert.equal(catalog.runtimeComplete, false);
  assert.ok(Object.keys(catalog.frames).length >= 30);

  const usedFiles = new Set();
  for (const [frameId, frame] of Object.entries(catalog.frames)) {
    assert.equal(frame.file.includes(".."), false, `${frameId} escapes the asset root`);
    assert.ok(catalog.sources[frame.source], `${frameId} has an unknown source`);
    assert.match(
      frame.sourceFrame,
      frame.source === "kenney-roguelike-indoors"
        ? /^roguelikeIndoor_transparent:r\d+c\d+$/
        : /^tile_\d{4}$/,
    );
    assert.equal(usedFiles.has(frame.file), false, `${frame.file} is mapped more than once`);
    usedFiles.add(frame.file);
    assert.deepEqual(
      pngDimensions(path.join(ASSET_ROOT, frame.file)),
      { width: 16, height: 16 },
      `${frameId} is not a native 16x16 PNG`,
    );
  }

  for (const source of Object.values(catalog.sources)) {
    assert.equal(source.license, "CC0-1.0");
    assert.ok(readFileSync(path.join(ASSET_ROOT, source.licenseFile), "utf8").includes("CC0"));
  }

  for (const itemId of ["axe", "hoe", "watering_can", "turnip_seeds", "turnip", "logs"]) {
    assert.ok(catalog.frames[`item.${itemId}`], `missing item icon: ${itemId}`);
  }
});
