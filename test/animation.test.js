import assert from "node:assert/strict";
import test from "node:test";

import {
  actorHeldItemView,
  chestFrameId,
  getActorRenderPosition,
  heldItemRenderLayout,
  operationPreview,
  operationWorkView,
  recentActionEffects,
  rechargeStationFrameId,
  renderGame,
  terrainFrameId,
} from "../src/adapters/browser/renderer.js";
import { CROP_TYPES } from "../src/game/world/entities/plants/crop-types.js";

test("actor rendering interpolates a tile transition without changing game position", () => {
  const actor = {
    position: { x: 3, y: 2 },
    facing: "east",
    motion: {
      from: { x: 2, y: 2 },
      to: { x: 3, y: 2 },
      startedTick: 7,
      durationTicks: 2,
    },
  };

  assert.deepEqual(getActorRenderPosition(actor, 7, 0), { x: 2, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 7, 1), { x: 2.5, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 8, 0.5), { x: 2.75, y: 2 });
  assert.deepEqual(getActorRenderPosition(actor, 8, 1), { x: 3, y: 2 });
  assert.deepEqual(actor.position, { x: 3, y: 2 });
});

test("idle actors raise selected items toward the pointer-directed action tile", () => {
  const actor = {
    role: "human",
    mapId: "farm",
    position: { x: 4, y: 3 },
    facing: "south",
    sleeping: false,
    activeIntent: null,
    selectedSlot: 1,
    inventory: [{ itemId: "turnip", quantity: 2 }],
  };

  assert.deepEqual(actorHeldItemView(actor, { mapId: "farm", x: 3, y: 3 }), {
    itemId: "turnip",
    facing: "west",
    frameId: "actor.farmhand_b.raised",
  });
  actor.role = "robot";
  assert.equal(actorHeldItemView(actor).frameId, "actor.robot.raised");
  actor.activeIntent = "operation-1";
  assert.equal(actorHeldItemView(actor), null);
});

test("held items render at one full tile above the raised actor", () => {
  assert.deepEqual(heldItemRenderLayout({ x: 4, y: 3 }, "north", 48), {
    left: 192,
    top: 106,
    size: 48,
  });
  assert.deepEqual(heldItemRenderLayout({ x: 4, y: 3 }, "east", 48), {
    left: 198,
    top: 111,
    size: 48,
  });
});

test("completed transitions render at the authoritative tile", () => {
  const actor = {
    position: { x: 4, y: 5 },
    facing: "south",
    motion: {
      from: { x: 4, y: 4 },
      to: { x: 4, y: 5 },
      startedTick: 11,
      durationTicks: 1,
    },
  };

  assert.deepEqual(getActorRenderPosition(actor, 12, 0), { x: 4, y: 5 });
});

test("storage presentation selects matching closed and open chest frames", () => {
  assert.equal(chestFrameId(false), "entity.chest.closed");
  assert.equal(chestFrameId(true), "entity.chest.open");
});

test("charging station presentation follows remaining energy", () => {
  const station = { charge: 40, capacity: 40 };
  assert.equal(rechargeStationFrameId(station), "item.recharge_station");
  station.charge = 25;
  assert.equal(rechargeStationFrameId(station), "entity.recharge_station.medium");
  station.charge = 10;
  assert.equal(rechargeStationFrameId(station), "entity.recharge_station.low");
  station.charge = 0;
  assert.equal(rechargeStationFrameId(station), "entity.recharge_station.empty");
});

test("water terrain selects matching nine-slice pond frames", () => {
  const world = {
    terrain: Array.from({ length: 3 }, () => Array(3).fill("water")),
  };
  assert.equal(terrainFrameId(world, 0, 0), "terrain.water.top_left");
  assert.equal(terrainFrameId(world, 1, 0), "terrain.water.top");
  assert.equal(terrainFrameId(world, 2, 0), "terrain.water.top_right");
  assert.equal(terrainFrameId(world, 0, 1), "terrain.water.left");
  assert.equal(terrainFrameId(world, 1, 1), "terrain.water.center");
  assert.equal(terrainFrameId(world, 2, 1), "terrain.water.right");
  assert.equal(terrainFrameId(world, 0, 2), "terrain.water.bottom_left");
  assert.equal(terrainFrameId(world, 1, 2), "terrain.water.bottom");
  assert.equal(terrainFrameId(world, 2, 2), "terrain.water.bottom_right");
});

test("path terrain uses the stepping-stone route frame", () => {
  assert.equal(terrainFrameId({ terrain: [["path"]] }, 0, 0), "terrain.path");
});

test("interior floor terrain uses the wood floor frame", () => {
  assert.equal(terrainFrameId({ terrain: [["floor"]] }, 0, 0), "interior.floor_wood");
});

test("every crop defines a complete renderer frame sequence", () => {
  for (const crop of Object.values(CROP_TYPES)) {
    assert.equal(crop.spriteStages.length, 4);
    assert.ok(crop.spriteStages.every((frameId) => frameId.startsWith(`crop.${crop.id}.`)));
  }
});

test("operation preview exposes only current-map route steps and destination", () => {
  const state = {
    world: { entities: { player: { mapId: "farm", activeIntent: "operation-1" } } },
    operations: {
      "operation-1": {
        path: [
          { mapId: "farm", x: 2, y: 3 },
          { mapId: "farmhouse", x: 4, y: 4 },
        ],
        command: { target: { mapId: "farm", x: 3, y: 3 } },
      },
    },
  };

  assert.deepEqual(operationPreview(state, "player"), {
    mapId: "farm",
    path: [{ mapId: "farm", x: 2, y: 3 }],
    destination: { mapId: "farm", x: 3, y: 3 },
  });
  state.world.entities.player.activeIntent = null;
  assert.equal(operationPreview(state, "player"), null);
});

test("secondary rendering can focus the robot on a different map", () => {
  const state = {
    tick: 0,
    history: [],
    operations: {},
    world: {
      maps: {
        farm: { id: "farm", width: 1, height: 1, terrain: [["grass"]] },
        farmhouse: { id: "farmhouse", width: 1, height: 1, terrain: [["floor"]] },
      },
      entities: {
        player: { id: "player", type: "actor", role: "player", mapId: "farm", position: { x: 0, y: 0 }, inventory: [], selectedSlot: 1 },
        robot: { id: "robot", type: "actor", role: "robot", mapId: "farmhouse", position: { x: 0, y: 0 }, inventory: [], selectedSlot: 1 },
      },
    },
  };
  const fills = [];
  const context = {
    canvas: { width: 48, height: 48 },
    clearRect() {},
    fillRect(...values) { fills.push(values); },
    strokeRect() {},
    drawImage() {},
    save() {},
    restore() {},
    translate() {},
  };

  assert.deepEqual(renderGame(context, state, { focusActorId: "robot" }), { x: 0, y: 0 });
  assert.ok(fills.length > 0);
});

test("work feedback exposes shared cooldown progress and selected item", () => {
  const state = {
    world: {
      entities: {
        player: {
          activeIntent: "operation-1",
          selectedSlot: 1,
          inventory: [{ itemId: "axe", quantity: 1 }],
        },
      },
    },
    operations: {
      "operation-1": {
        phase: "working",
        cooldown: 1,
        command: { item: { itemId: "watering_can" } },
      },
    },
  };

  assert.deepEqual(operationWorkView(state, "player"), {
    progress: 0.5,
    itemId: "watering_can",
    action: "use_item",
  });
  state.operations["operation-1"].phase = "moving";
  assert.equal(operationWorkView(state, "player"), null);
});

test("recent action effects project map-local harvest yield and item impacts", () => {
  const state = {
    tick: 12,
    history: [
      {
        type: "crop_harvested",
        tick: 11,
        target: { mapId: "farm", x: 4, y: 5 },
        cropType: "potato",
        quantity: 3,
      },
      {
        type: "use_item",
        tick: 10,
        target: { mapId: "farm", x: 5, y: 5 },
        itemId: "watering_can",
      },
      {
        type: "use_item",
        tick: 12,
        target: { mapId: "farmhouse", x: 1, y: 1 },
        itemId: "hoe",
      },
      {
        type: "crop_harvested",
        tick: 8,
        target: { mapId: "farm", x: 6, y: 5 },
        quantity: 1,
      },
    ],
  };

  assert.deepEqual(recentActionEffects(state, "farm"), [
    { ...state.history[0], age: 1 / 3 },
    { ...state.history[1], age: 2 / 3 },
  ]);
});