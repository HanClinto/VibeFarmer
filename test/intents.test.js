import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { moveStep } from "../src/game/actions/actions.js";
import { GAME_CONFIG } from "../src/game/config.js";
import { createFarmState } from "../src/game/farm.js";
import { createGameState } from "../src/game/state.js";
import { submitMoveTo } from "../src/game/world/entities/actors/intents.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { addWorldEntity, createWorld } from "../src/game/world/world.js";

function createParityState(actorId) {
  const state = createGameState({
    world: createWorld({
      width: 7,
      height: 7,
      objects: [{
        type: "tree",
        x: 4,
        y: 4,
        hitPoints: GAME_CONFIG.treeHitPoints,
      }],
    }),
  });
  state.world.entities[actorId].position = { x: 1, y: 4 };
  state.world.entities[actorId].sleeping = false;
  state.world.entities[actorId === "player" ? "robot" : "player"].position = { x: 0, y: 0 };
  return state;
}

function runToCompletion(controller, operationId, maxTicks = 100) {
  let ticks = 0;
  while (controller.getSnapshot().operations[operationId].status === "running") {
    assert.ok(ticks < maxTicks, "operation did not finish");
    controller.tick();
    ticks += 1;
  }
  return ticks;
}

test("move_to advances either actor through deterministic ticks", () => {
  for (const actorId of ["player", "robot"]) {
    const controller = createController(createParityState(actorId));
    const submission = controller.submit({
      type: "move_to",
      actorId,
      target: { x: 3, y: 4 },
    });

    assert.equal(submission.success, true);
    assert.ok(controller.getSnapshot().operations[submission.operationId].path.every(
      (step) => step.mapId === "farm",
    ));
    assert.deepEqual(controller.getSnapshot().world.entities[actorId].position, { x: 1, y: 4 });
    const ticks = runToCompletion(controller, submission.operationId);
    assert.equal(ticks, 4);
    assert.deepEqual(controller.getSnapshot().world.entities[actorId].position, { x: 3, y: 4 });
  }
});

test("water terrain blocks both actors through shared pathfinding", () => {
  for (const actorId of ["player", "robot"]) {
    const state = createGameState();
    state.world.terrain[2][2] = "water";
    assert.equal(submitMoveTo(state, actorId, { x: 2, y: 2 }).code, "DESTINATION_UNREACHABLE");
  }
});

test("targets default to the actor map and reject explicit cross-map actions", () => {
  for (const actorId of ["player", "robot"]) {
    const state = createParityState(actorId);
    state.world.maps.farmhouse = {
      id: "farmhouse",
      width: 7,
      height: 7,
      terrain: Array.from({ length: 7 }, () => Array(7).fill("grass")),
    };

    const local = submitMoveTo(state, actorId, { x: 2, y: 4 });
    assert.equal(local.success, true);
    assert.deepEqual(state.operations[local.operationId].command.target, {
      mapId: "farm",
      x: 2,
      y: 4,
    });

    state.world.entities[actorId].activeIntent = null;
    delete state.operations[local.operationId];
    const crossMapMove = submitMoveTo(state, actorId, {
      mapId: "farmhouse",
      x: 2,
      y: 4,
    });
    assert.equal(crossMapMove.code, "TARGET_DIFFERENT_MAP");

    const crossMapInteraction = createController(state).submit({
      type: "interact_at",
      actorId,
      target: { mapId: "farmhouse", x: 4, y: 4 },
      item: { itemId: "axe" },
    });
    assert.equal(crossMapInteraction.code, "TARGET_DIFFERENT_MAP");
  }
});

test("interact_at has identical tick count and effects for player and robot", () => {
  const results = ["player", "robot"].map((actorId) => {
    const controller = createController(createParityState(actorId));
    const submission = controller.submit({
      type: "interact_at",
      actorId,
      target: { x: 4, y: 4 },
      item: { itemId: "axe" },
    });
    const ticks = runToCompletion(controller, submission.operationId);
    const state = controller.getSnapshot();
    return {
      ticks,
      operation: state.operations[submission.operationId],
      actor: state.world.entities[actorId],
      tree: state.world.entities["tree-1"],
    };
  });

  assert.equal(results[0].ticks, results[1].ticks);
  assert.equal(results[0].ticks, 6);
  assert.deepEqual(results[0].actor.position, results[1].actor.position);
  assert.equal(results[0].actor.stamina, GAME_CONFIG.maxStamina - 2);
  assert.equal(results[0].tree.hitPoints, GAME_CONFIG.treeHitPoints - 1);
  assert.equal(results[0].operation.result.code, "INTERACTION_COMPLETE");
});

test("interact_at uses an adjacent target without walking away first", () => {
  const state = createParityState("player");
  state.world.entities.player.position = { x: 3, y: 4 };
  const controller = createController(state);

  const submission = controller.submit({
    type: "interact_at",
    actorId: "player",
    target: { x: 4, y: 4 },
    item: { itemId: "axe" },
  });

  assert.equal(submission.success, true);
  assert.deepEqual(state.operations[submission.operationId].path, []);
  const ticks = runToCompletion(controller, submission.operationId);
  assert.equal(ticks, GAME_CONFIG.workCooldownTicks + 1);
  assert.deepEqual(state.world.entities.player.position, { x: 3, y: 4 });
  assert.equal(state.world.entities["tree-1"].hitPoints, GAME_CONFIG.treeHitPoints - 1);
});

test("item jobs select and retain the robot inventory slot they use", () => {
  const state = createGameState();
  const robot = state.world.entities.robot;
  robot.sleeping = false;
  state.world.terrain[2][2] = "tilled";
  const controller = createController(state);

  const watering = controller.submit({
    type: "interact_at",
    actorId: "robot",
    target: { x: 2, y: 2 },
    item: { itemId: "watering_can" },
  });
  assert.equal(watering.success, true);
  assert.equal(robot.selectedSlot, 3);
  assert.deepEqual(state.operations[watering.operationId].command.item, {
    itemId: "watering_can",
  });
  runToCompletion(controller, watering.operationId);
  assert.equal(robot.selectedSlot, 3);

  const planting = controller.submit({
    type: "interact_at",
    actorId: "robot",
    target: { x: 2, y: 2 },
    item: { itemId: "turnip_seeds" },
  });
  assert.equal(planting.success, true);
  assert.equal(robot.selectedSlot, 4);
  assert.deepEqual(state.operations[planting.operationId].command.item, {
    itemId: "turnip_seeds",
  });
  runToCompletion(controller, planting.operationId);
  assert.equal(robot.selectedSlot, 4);
});

test("rejected item jobs preserve the robot selected slot", () => {
  const state = createGameState();
  const robot = state.world.entities.robot;
  robot.sleeping = false;
  robot.selectedSlot = 2;
  const controller = createController(state);

  const rejected = controller.submit({
    type: "interact_at",
    actorId: "robot",
    target: { x: 2, y: 2 },
    item: { itemId: "watering_can" },
  });

  assert.equal(rejected.success, false);
  assert.equal(rejected.code, "INVALID_WATER_TARGET");
  assert.equal(robot.selectedSlot, 2);
});

test("mature crops harvest before held-item use for either actor", () => {
  for (const [actorId, heldItem] of [
    ["player", { itemId: "axe", quantity: 1 }],
    ["robot", { itemId: "corn", quantity: 2 }],
  ]) {
    const state = createParityState(actorId);
    const actor = state.world.entities[actorId];
    actor.inventory[4] = heldItem;
    actor.selectedSlot = 5;
    const plant = createPlant({
      id: `turnip-${actorId}`,
      cropType: "turnip",
      position: { x: 3, y: 4 },
    });
    plant.growthStage = plant.matureStage;
    addWorldEntity(state.world, plant);
    const controller = createController(state);

    const submission = controller.submit({
      type: "interact_at",
      actorId,
      target: { x: 3, y: 4 },
    });

    assert.equal(submission.success, true);
    assert.deepEqual(state.operations[submission.operationId].command.item, {
      action: "harvest",
    });
    runToCompletion(controller, submission.operationId);
    assert.equal(state.world.entities[plant.id], undefined);
    assert.deepEqual(actor.inventory[4], heldItem);
    assert.ok(actor.inventory.some(
      (stack) => stack?.itemId === "turnip" && stack.quantity === 1,
    ));
  }
});

test("held items retain normal behavior on immature crops", () => {
  const state = createParityState("player");
  const plant = createPlant({
    id: "immature-turnip",
    cropType: "turnip",
    position: { x: 3, y: 4 },
  });
  addWorldEntity(state.world, plant);

  const result = createController(state).submit({
    type: "interact_at",
    actorId: "player",
    target: { x: 3, y: 4 },
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INVALID_AXE_TARGET");
  assert.equal(state.world.entities[plant.id], plant);
});

test("a one-tile move remains active while its final interpolation settles", async () => {
  const state = createParityState("player");
  const controller = createController(state);
  const submission = controller.submit({
    type: "move_to",
    actorId: "player",
    target: { x: 2, y: 4 },
  });

  controller.tick();
  assert.equal(state.operations[submission.operationId].phase, "settling");
  assert.equal(state.operations[submission.operationId].status, "running");
  assert.equal(state.world.entities.player.activeIntent, submission.operationId);

  controller.tick();
  assert.equal((await submission.completion).code, "DESTINATION_REACHED");
  assert.equal(state.operations[submission.operationId].status, "completed");
});

test("a second intent for the same actor is rejected as busy", () => {
  const controller = createController(createParityState("robot"));
  const first = controller.submit({
    type: "move_to",
    actorId: "robot",
    target: { x: 3, y: 4 },
  });
  const second = controller.submit({
    type: "move_to",
    actorId: "robot",
    target: { x: 2, y: 4 },
  });

  assert.equal(first.success, true);
  assert.equal(second.success, false);
  assert.equal(second.code, "ACTOR_BUSY");
  assert.equal(second.operationId, first.operationId);
});

test("failed smart interaction does not create an operation or spend stamina", () => {
  const state = createParityState("player");
  addWorldEntity(state.world, { id: "rock-1", type: "rock", position: { x: 3, y: 4 } });
  addWorldEntity(state.world, { id: "rock-2", type: "rock", position: { x: 4, y: 3 } });
  addWorldEntity(state.world, { id: "rock-3", type: "rock", position: { x: 5, y: 4 } });
  addWorldEntity(state.world, { id: "rock-4", type: "rock", position: { x: 4, y: 5 } });
  const controller = createController(state);

  const result = controller.submit({
    type: "interact_at",
    actorId: "player",
    target: { x: 4, y: 4 },
    item: { itemId: "axe" },
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INTERACTION_UNREACHABLE");
  assert.equal(state.world.entities.player.stamina, GAME_CONFIG.maxStamina);
  assert.deepEqual(state.operations, {});
});

test("actors can path through crop tiles without damaging crops", () => {
  const state = createParityState("player");
  addWorldEntity(state.world, createPlant({
    id: "plant-path",
    cropType: "turnip",
    position: { x: 2, y: 4 },
  }));
  const controller = createController(state);
  const submission = controller.submit({
    type: "move_to",
    actorId: "player",
    target: { x: 3, y: 4 },
  });

  assert.equal(submission.success, true);
  runToCompletion(controller, submission.operationId);
  assert.deepEqual(state.world.entities.player.position, { x: 3, y: 4 });
  assert.ok(state.history.some(
    (event) => event.type === "move" && event.target.x === 2 && event.target.y === 4,
  ));
  assert.equal(state.world.entities["plant-path"].growthStage, 0);
});

test("walking onto a portal moves an actor through the ordinary movement path", () => {
  const state = createFarmState();
  const actor = state.world.entities.player;
  actor.position = { x: 3, y: 5 };

  const result = moveStep(state, "player", { mapId: "farm", x: 3, y: 4 });

  assert.equal(result.code, "PORTAL_TRAVELLED");
  assert.equal(actor.mapId, "farmhouse");
  assert.deepEqual(actor.position, { x: 4, y: 4 });
  assert.equal(actor.facing, "north");
  assert.ok(state.history.some(
    (event) => event.type === "portal_travel" && event.portalId === "portal-farmhouse-door",
  ));

  const returnResult = moveStep(state, "player", {
    mapId: "farmhouse",
    x: 4,
    y: 5,
  });
  assert.equal(returnResult.code, "PORTAL_TRAVELLED");
  assert.equal(actor.mapId, "farm");
  assert.deepEqual(actor.position, { x: 3, y: 5 });
});

test("move_to can route from the starting farm position through the farmhouse door", () => {
  const state = createFarmState();
  const controller = createController(state);
  const submission = controller.submit({
    type: "move_to",
    actorId: "player",
    target: { mapId: "farm", x: 3, y: 4 },
  });

  assert.equal(submission.success, true);
  runToCompletion(controller, submission.operationId);
  assert.equal(state.world.entities.player.mapId, "farmhouse");
  assert.deepEqual(state.world.entities.player.position, { x: 4, y: 4 });
  assert.equal(state.operations[submission.operationId].status, "completed");
});
