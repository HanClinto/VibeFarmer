import assert from "node:assert/strict";
import { existsSync, readFileSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";

test("deployment artifact versions the entry point and transitive module imports", () => {
  const temporaryDirectory = mkdtempSync(path.join(os.tmpdir(), "vibe-farmer-site-"));
  const outputDirectory = path.join(temporaryDirectory, "site");

  try {
    const build = spawnSync(
      process.execPath,
      ["scripts/build-site.mjs", outputDirectory, "abc1234"],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    assert.equal(build.status, 0, build.stderr);

    const html = readFileSync(path.join(outputDirectory, "index.html"), "utf8");
    assert.match(html, /styles\/game\.css\?v=abc1234/);
    assert.match(html, /src\/adapters\/browser\/main\.js\?v=abc1234/);

    const main = readFileSync(
      path.join(outputDirectory, "src/adapters/browser/main.js"),
      "utf8",
    );
    assert.match(main, /\.\.\/\.\.\/application\/controller\.js\?v=abc1234/);
    assert.match(main, /\.\/runtime\.js\?v=abc1234/);

    const controller = readFileSync(
      path.join(outputDirectory, "src/application/controller.js"),
      "utf8",
    );
    assert.match(controller, /\.\.\/game\/simulation\.js\?v=abc1234/);
    assert.equal(existsSync(path.join(outputDirectory, "assets/game/catalog.json")), true);
    assert.equal(
      existsSync(path.join(outputDirectory, "assets/game/kenney/tiny-farm/crop-0.png")),
      true,
    );
    assert.equal(
      existsSync(path.join(outputDirectory, "assets/game/licenses/kenney-tiny-farm.txt")),
      true,
    );
    assert.equal(existsSync(path.join(outputDirectory, "assets/game/experiments")), false);
    assert.equal(existsSync(path.join(outputDirectory, "src/.DS_Store")), false);
    assert.equal(existsSync(path.join(outputDirectory, "assets/sprites")), false);
    assert.equal(existsSync(path.join(outputDirectory, "assets/farm assets")), false);
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
});

test("resizable Market layout preserves the hidden window contract", () => {
  const css = readFileSync("styles/game.css", "utf8");
  assert.match(css, /\.market-window\s*\{[^}]*display:\s*flex;/s);
  assert.match(css, /\.market-window\[hidden\]\s*\{[^}]*display:\s*none;/s);
});

test("Robot View modes preserve the hidden element contract", () => {
  const css = readFileSync("styles/game.css", "utf8");
  assert.match(
    css,
    /\.robot-view-frame\s*>\s*\[hidden\]\s*\{[^}]*display:\s*none\s*!important;/s,
  );
});
