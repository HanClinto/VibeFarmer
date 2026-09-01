import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { registerWebMcp } from "../src/adapters/webmcp/adapter.js";
import {
  createWebMcpTools,
  inspectGame,
  inspectMarket,
} from "../src/adapters/webmcp/tools.js";
import { createGameState } from "../src/game/state.js";
import { createFarmState } from "../src/game/farm.js";
import { createChest } from "../src/game/world/entities/containers/chests.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { ITEM_TYPES } from "../src/game/world/entities/items/item-types.js";
import { addWorldEntity } from "../src/game/world/world.js";

function toolByName(tools, name) {
  return tools.find((tool) => tool.name === name);
}

function tickUntilIdle(controller, actorId = "robot", limit = 100) {
  let ticks = 0;
  while (controller.getSnapshot().world.entities[actorId].activeIntent) {
    assert.ok(ticks < limit, "tool operation did not finish");
    controller.tick();
    ticks += 1;
  }
}

test("registerWebMcp registers the compact primitive surface", async () => {
  const registered = [];
  const modelContext = {
    registerTool(tool, options) {
      registered.push({ tool, options });
      return Promise.resolve();
    },
  };

  const registration = await registerWebMcp(
    modelContext,
    createController(createGameState()),
  );
  const names = registered.map(({ tool }) => tool.name);

  assert.equal(registration.supported, true);
  assert.deepEqual(names, [
    "inspect_game",
    "inspect_market",
    "move_to",
    "interact_at",
    "select_slot",
    "buy_item",
    "sell_item",
    "transfer_item",
    "sleep",
    "cancel_operation",
  ]);
  assert.equal(names.some((name) => /plan|all|batch/.test(name)), false);
  assert.ok(registered.every(({ options }) => options.signal instanceof AbortSignal));
  const buyTool = registered.find(({ tool }) => tool.name === "buy_item").tool;
  assert.equal(buyTool.title, "Buy one item");
  assert.match(buyTool.description, /inspect_market/);
  assert.deepEqual(
    buyTool.inputSchema.properties.itemId.enum,
    Object.values(ITEM_TYPES).filter((item) => item.buyPrice).map((item) => item.id),
  );
});

test("unsupported browsers retain locally invokable tool definitions", async () => {
  const registration = await registerWebMcp(null, createController(createGameState()));
  assert.equal(registration.supported, false);
  assert.equal(registration.tools.length, 10);
});

test("world inspection exposes local context and curated counts without market listings", () => {
  const inspected = inspectGame(createController(createGameState()));
  const player = inspected.entities.find((entity) => entity.id === "player");
  const robot = inspected.entities.find((entity) => entity.id === "robot");

  assert.equal("market" in inspected, false);
  assert.equal("entityCounts" in inspected, false);
  assert.equal("cropCounts" in inspected, false);
  assert.deepEqual(inspected.worldCounts, {
    mapId: "farm",
    trees: 0,
    rocks: 0,
    chests: 0,
    markets: 0,
    rechargeStations: 0,
    beds: 0,
    portals: 0,
    crops: { total: 0, growing: 0, harvestReady: 0, watered: 0, dry: 0 },
  });
  assert.equal("inventory" in player, false);
  assert.ok(Array.isArray(robot.inventory));
  assert.equal("terrain" in inspected, false);
  assert.match(inspected.view.ascii, /R/);
  assert.match(inspected.view.legend.terrain, /W watered/);
});

test("market inspection returns listings, locations, access, and shared money on demand", () => {
  const state = createFarmState();
  const controller = createController(state);
  const inspected = inspectMarket(controller);

  assert.equal(inspected.code, "MARKET_INSPECTED");
  assert.equal(inspected.money, state.money);
  assert.deepEqual(inspected.inventory.buy, Object.values(ITEM_TYPES)
    .filter((item) => item.buyPrice)
    .map((item) => ({
      itemId: item.id,
      name: item.name,
      category: item.category,
      price: item.buyPrice,
    })));
  assert.equal(inspected.markets.length, 1);
  assert.deepEqual(inspected.markets[0].tiles, [
    { x: 18, y: 11 },
    { x: 19, y: 11 },
    { x: 20, y: 11 },
  ]);
  assert.equal(inspected.markets[0].canTrade, false);
  state.world.entities.robot.position = { x: 18, y: 12 };
  assert.equal(inspectMarket(controller).markets[0].canTrade, true);
});

test("default world inspection omits the on-demand market payload", () => {
  const controller = createController(createFarmState());
  const world = inspectGame(controller);
  const market = inspectMarket(controller);
  const worldJson = JSON.stringify(world);
  const legacyJson = JSON.stringify({ ...world, market: market.inventory });

  assert.equal(worldJson.includes('"inventory":{"buy"'), false);
  assert.ok(worldJson.length < legacyJson.length * 0.8);
});

test("compact inspection filters a bounded area by entity type", () => {
  const inspected = inspectGame(createController(createFarmState()), {
    mapId: "farm",
    x: 20,
    y: 2,
    radius: 2,
    entityTypes: ["tree"],
  });

  assert.deepEqual(inspected.view.center, { x: 20, y: 2 });
  assert.deepEqual(inspected.view.bounds, { left: 18, top: 0, right: 22, bottom: 4 });
  assert.ok(inspected.entities.length > 0);
  assert.ok(inspected.entities.every((entity) => entity.type === "tree"));
  assert.equal(inspected.view.ascii.split("\n").length, 7);
  assert.equal(inspected.worldCounts.trees, 20);
  assert.equal(inspected.worldCounts.markets, 1);
  assert.equal("decorations" in inspected.worldCounts, false);
});

test("compact entities retain metadata needed for ordinary planning", () => {
  const inspected = inspectGame(createController(createFarmState()));
  const chest = inspected.entities.find((entity) => entity.id === "chest-1");
  const portal = inspected.entities.find((entity) => entity.id === "portal-farmhouse-door");

  assert.equal(chest.capacity, 20);
  assert.equal(chest.usedSlots, 0);
  assert.deepEqual(portal.destination, {
    mapId: "farmhouse",
    x: 4,
    y: 4,
    facing: "north",
  });
});

test("ASCII and sparse plant records distinguish moisture and harvest readiness", () => {
  const state = createFarmState();
  const crops = [
    { id: "dry-growing", x: 7, terrain: "tilled", mature: false },
    { id: "wet-growing", x: 8, terrain: "wet_tilled", mature: false },
    { id: "dry-ready", x: 9, terrain: "tilled", mature: true },
    { id: "wet-ready", x: 10, terrain: "wet_tilled", mature: true },
  ];
  for (const crop of crops) {
    state.world.maps.farm.terrain[8][crop.x] = crop.terrain;
    const plant = createPlant({
      id: crop.id,
      cropType: "turnip",
      position: { x: crop.x, y: 8 },
    });
    if (crop.mature) plant.growthStage = plant.matureStage;
    addWorldEntity(state.world, plant);
  }

  const inspected = inspectGame(createController(state), {
    mapId: "farm",
    x: 8,
    y: 8,
    radius: 2,
    entityTypes: ["plant"],
  });
  const cropRow = inspected.view.ascii.split("\n").find((row) => row.startsWith("08 "));

  assert.equal(cropRow, "08 .gGhH");
  assert.match(inspected.view.legend.entities, /g dry growing crop/);
  assert.equal(inspected.entities.find((entity) => entity.id === "dry-growing").watered, false);
  assert.equal(inspected.entities.find((entity) => entity.id === "wet-growing").watered, true);
  assert.deepEqual(inspected.worldCounts.crops, {
    total: 4,
    growing: 2,
    harvestReady: 2,
    watered: 2,
    dry: 2,
  });
});

test("detailed inspection opts into terrain, all selected-map entities, and bounded history", () => {
  const controller = createController(createFarmState());
  controller.execute({ type: "select_slot", actorId: "robot", slot: 2, source: "webmcp" });
  controller.execute({ type: "select_slot", actorId: "robot", slot: 3, source: "webmcp" });

  const compact = inspectGame(controller);
  const detailed = inspectGame(controller, {
    mode: "detailed",
    includeHistory: true,
    historyLimit: 1,
  });

  assert.ok(Array.isArray(detailed.terrain));
  assert.ok(detailed.entityCounts.tree > 0);
  assert.deepEqual(detailed.cropCounts, {});
  assert.ok(detailed.entities.some((entity) => entity.type === "decoration"));
  assert.equal(detailed.history.length, 1);
  assert.ok(JSON.stringify(compact).length < JSON.stringify(detailed).length * 0.6);
});

test("inspection reports an unknown map without serializing world state", () => {
  assert.deepEqual(
    inspectGame(createController(createFarmState()), { mapId: "missing" }),
    { success: false, code: "MAP_NOT_FOUND", mapId: "missing" },
  );
});

test("move_to stays pending until simulation ticks complete", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const promise = toolByName(tools, "move_to").execute(
    { x: 2, y: 3 },
    { signal: new AbortController().signal },
  );
  let settled = false;
  promise.then(() => {
    settled = true;
  });
  await Promise.resolve();
  assert.equal(settled, false);

  tickUntilIdle(controller);
  const result = await promise;
  assert.equal(result.code, "DESTINATION_REACHED");
  assert.ok(result.completedTick > result.submittedTick);
  assert.deepEqual(result.finalPosition, { x: 2, y: 3 });
  assert.equal(result.pathResult.status, "completed");
  assert.equal(result.pathResult.remainingSteps, 0);
  assert.ok(result.changedState.eventTypes.includes("move"));
  assert.ok(result.changedState.eventTypes.includes("intent_completed"));
  assert.deepEqual(result.robot.position, { x: 2, y: 3 });
  assert.equal("player" in result, false);
  assert.ok(result.recoverableNextActions.includes("interact_at"));
});

test("paused WebMCP operations remain pending and resume as the same operation", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  controller.setTicksEnabled(false);
  const promise = toolByName(tools, "move_to").execute({ x: 2, y: 2 });
  await Promise.resolve();

  const operation = Object.values(controller.getSnapshot().operations)[0];
  assert.equal(operation.status, "waiting_for_ticks");
  assert.equal(controller.tick().code, "TICKS_PAUSED");
  assert.equal(controller.getSnapshot().tick, 0);

  controller.setTicksEnabled(true);
  tickUntilIdle(controller);
  const output = await promise;
  assert.equal(output.operationId, operation.operationId);
  assert.equal(output.code, "DESTINATION_REACHED");
});

test("an unobserved tool call continues authoritatively to completion", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const abandonedForNow = toolByName(tools, "move_to").execute({ x: 2, y: 3 });
  const operationId = controller.getSnapshot().world.entities.robot.activeIntent;

  tickUntilIdle(controller);
  const operation = controller.getSnapshot().operations[operationId];
  assert.equal(operation.status, "completed");
  assert.deepEqual(controller.getSnapshot().world.entities.robot.position, { x: 2, y: 3 });
  assert.equal((await abandonedForNow).operationId, operationId);
});

test("failed intent results include privacy-safe recovery context", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const first = toolByName(tools, "move_to").execute({ x: 2, y: 3 });
  const busy = await toolByName(tools, "move_to").execute({ x: 3, y: 3 });

  assert.equal(busy.code, "ACTOR_BUSY");
  assert.equal(busy.pathResult, null);
  assert.deepEqual(busy.recoverableNextActions, ["inspect_game", "cancel_operation"]);
  assert.ok(Array.isArray(busy.robot.inventory));
  assert.equal("playerInventory" in busy, false);

  tickUntilIdle(controller);
  await first;
});

test("interact_at reports the resolved item and changed action state", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const promise = toolByName(tools, "interact_at").execute({
    x: 2,
    y: 2,
    itemId: "hoe",
  });

  tickUntilIdle(controller);
  const output = await promise;
  assert.equal(output.code, "INTERACTION_COMPLETE");
  assert.deepEqual(output.resolvedItem, { itemId: "hoe", slot: 2 });
  assert.ok(output.changedState.eventTypes.includes("use_item"));
  assert.equal(output.robot.stamina, 19);
  assert.equal(output.robot.inventory[1].itemId, "hoe");
  assert.equal("playerInventory" in output.robot, false);
});

test("WebMCP storage permits delivery but not player inventory withdrawal", async () => {
  const state = createGameState();
  addWorldEntity(state.world, createChest({ id: "chest-1", position: { x: 3, y: 1 } }));
  const controller = createController(state);
  const transfer = toolByName(createWebMcpTools(controller), "transfer_item");

  const stored = await transfer.execute({
    fromEntityId: "robot",
    toEntityId: "chest-1",
    itemId: "turnip_seeds",
  });
  assert.equal(stored.code, "ITEM_TRANSFERRED");
  assert.equal(state.world.entities["chest-1"].inventory[0].itemId, "turnip_seeds");

  const delivered = await transfer.execute({
    fromEntityId: "robot",
    toEntityId: "player",
    itemId: "turnip_seeds",
  });
  assert.equal(delivered.code, "ITEM_TRANSFERRED");
  assert.equal(delivered.moved, 1);

  const privateWithdrawal = await transfer.execute({
    fromEntityId: "player",
    toEntityId: "robot",
    itemId: "axe",
  });
  assert.equal(privateWithdrawal.code, "PLAYER_INVENTORY_PRIVATE");
  assert.equal("inventory" in privateWithdrawal, false);
});

test("WebMCP trade follows the same market adjacency rule as the human", async () => {
  const state = createFarmState();
  const buy = toolByName(createWebMcpTools(createController(state)), "buy_item");

  assert.equal((await buy.execute({ itemId: "turnip_seeds" })).code, "MARKET_NOT_ADJACENT");
  state.world.entities.robot.position = { x: 18, y: 12 };
  assert.equal((await buy.execute({ itemId: "turnip_seeds" })).code, "ITEM_BOUGHT");
});

test("tool abort requests cancellation and resolves with a structured result", async () => {
  const controller = createController(createGameState());
  const tools = createWebMcpTools(controller);
  const abortController = new AbortController();
  const promise = toolByName(tools, "move_to").execute(
    { x: 2, y: 4 },
    { signal: abortController.signal },
  );

  abortController.abort();
  controller.tick();
  const result = await promise;
  assert.equal(result.code, "INTENT_CANCELLED");
});

test("invocation observer receives running and completed records", async () => {
  const records = [];
  const tools = createWebMcpTools(createController(createGameState()), {
    onInvocation(record) {
      records.push(record);
    },
  });

  await toolByName(tools, "inspect_game").execute({ includeHistory: false });

  assert.deepEqual(records.map((record) => record.status), ["running", "completed"]);
  assert.equal(records[0].invocationId, records[1].invocationId);
  assert.equal(records[1].output.code, "GAME_INSPECTED");
});