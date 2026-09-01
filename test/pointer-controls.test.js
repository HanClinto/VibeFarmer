import assert from "node:assert/strict";
import test from "node:test";

import {
  actionForCanvasClick,
  actionTargetForPointer,
} from "../src/adapters/browser/pointer-controls.js";
import { createFarmState } from "../src/game/farm.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { addWorldEntity } from "../src/game/world/world.js";

test("ordinary portal clicks move while occupied fallback tiles inspect", () => {
  const state = createFarmState();

  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 3, y: 4 }), {
    kind: "submit",
    command: {
      type: "move_to",
      actorId: "player",
      target: { mapId: "farm", x: 3, y: 4 },
    },
  });
  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 14, y: 3 }), {
    kind: "inspect",
    target: { mapId: "farm", x: 14, y: 3 },
  });
});

test("adjacent chest clicks open storage while distant, modified, and bed clicks inspect", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  const chestTarget = { mapId: "farm", x: 4, y: 5 };
  player.position = { x: 4, y: 4 };

  assert.deepEqual(actionForCanvasClick(state, chestTarget), {
    kind: "storage",
    entityId: "chest-1",
  });
  assert.deepEqual(actionForCanvasClick(state, chestTarget, { shiftKey: true }), {
    kind: "inspect",
    target: chestTarget,
  });

  player.position = { x: 6, y: 5 };
  assert.deepEqual(actionForCanvasClick(state, chestTarget), {
    kind: "inspect",
    target: chestTarget,
  });

  player.mapId = "farmhouse";
  player.position = { x: 1, y: 3 };
  const bedTarget = { mapId: "farmhouse", x: 1, y: 2 };
  assert.deepEqual(actionForCanvasClick(state, bedTarget), {
    kind: "inspect",
    target: bedTarget,
  });
});

test("plain click uses a valid selected item while Shift-click inspects", () => {
  const state = createFarmState();
  const target = { mapId: "farm", x: 20, y: 2 };

  assert.deepEqual(actionForCanvasClick(state, target), {
    kind: "submit",
    command: {
      type: "interact_at",
      actorId: "player",
      target,
    },
  });
  assert.deepEqual(actionForCanvasClick(state, target, { shiftKey: true }), {
    kind: "inspect",
    target,
  });
});

test("plain click prioritizes harvest, valid ground use, movement, then inspection", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  state.world.entities.robot.position = { x: 22, y: 17 };
  const plant = createPlant({
    id: "ready-turnip",
    cropType: "turnip",
    position: { x: 6, y: 5 },
  });
  plant.growthStage = plant.matureStage;
  addWorldEntity(state.world, plant);

  player.selectedSlot = 1;
  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 6, y: 5 }).command.item, {
    action: "harvest",
  });

  player.selectedSlot = 2;
  assert.equal(actionForCanvasClick(state, { mapId: "farm", x: 6, y: 4 }).command.type, "interact_at");

  player.selectedSlot = 1;
  assert.equal(actionForCanvasClick(state, { mapId: "farm", x: 6, y: 6 }).command.type, "move_to");
  assert.deepEqual(actionForCanvasClick(state, { mapId: "farm", x: 14, y: 3 }), {
    kind: "inspect",
    target: { mapId: "farm", x: 14, y: 3 },
  });
});

test("pointer direction selects one adjacent keyboard action tile", () => {
  const player = {
    mapId: "farm",
    position: { x: 5, y: 5 },
    facing: "south",
  };

  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 11, y: 7 }), {
    mapId: "farm", x: 6, y: 5,
  });
  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 4, y: 0 }), {
    mapId: "farm", x: 5, y: 4,
  });
  assert.deepEqual(actionTargetForPointer(player, { mapId: "farm", x: 5, y: 5 }), {
    mapId: "farm", x: 5, y: 6,
  });
  assert.equal(actionTargetForPointer(player, { mapId: "farmhouse", x: 5, y: 5 }), null);
});