import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { actionForCanvasClick } from "../src/adapters/browser/pointer-controls.js";
import { restoreState, serializeState } from "../src/adapters/browser/persistence.js";
import { createFarmState } from "../src/game/farm.js";
import { inspectLocation } from "../src/game/world/inspection.js";
import { getWorldEntitiesByType } from "../src/game/world/world.js";

test("the authored farm signs carry editable Markdown at stable locations", () => {
  const state = createFarmState();
  const signs = getWorldEntitiesByType(state.world, "sign", "farm");

  assert.deepEqual(signs.map(({ id, position }) => ({ id, position })), [
    { id: "sign-farmhouse", position: { x: 2, y: 5 } },
    { id: "sign-robot", position: { x: 7, y: 5 } },
    { id: "sign-market", position: { x: 17, y: 11 } },
  ]);
  assert.ok(signs.every((sign) => sign.spriteId === "building.sign" && sign.blocking));
});

test("sign inspection exposes Markdown and ordinary clicks open the sign", () => {
  const state = createFarmState();
  const target = { mapId: "farm", x: 7, y: 5 };
  const inspected = inspectLocation(state, "player", target).entities[0];

  assert.equal(inspected.id, "sign-robot");
  assert.match(inspected.markdown, /WebMCP-enabled browser/);
  assert.deepEqual(actionForCanvasClick(state, target), {
    kind: "sign",
    entityId: "sign-robot",
  });
});

test("controller sign edits persist with world state and reject non-signs", () => {
  const controller = createController(createFarmState());
  const result = controller.execute({
    source: "human-ui",
    type: "update_sign",
    entityId: "sign-farmhouse",
    markdown: "# New message",
  });

  assert.deepEqual(result, {
    success: true,
    code: "SIGN_UPDATED",
    entityId: "sign-farmhouse",
    markdown: "# New message",
  });
  assert.equal(controller.getSnapshot().world.entities["sign-farmhouse"].markdown, "# New message");
  const restored = restoreState(serializeState(controller.getSnapshot()));
  assert.equal(restored.state.world.entities["sign-farmhouse"].markdown, "# New message");
  assert.equal(controller.execute({
    type: "update_sign",
    entityId: "tree-1",
    markdown: "Nope",
  }).code, "SIGN_NOT_FOUND");
});