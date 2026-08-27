import assert from "node:assert/strict";
import test from "node:test";

import { buyItem, sleepActor, useItem } from "../src/game/actions/actions.js";
import { createController } from "../src/application/controller.js";
import { inspectGame } from "../src/adapters/webmcp/tools.js";
import { createFarmState } from "../src/game/farm.js";
import { inspectLocation } from "../src/game/world/inspection.js";
import { createRechargeStation } from "../src/game/world/entities/structures/recharge-stations.js";
import { addWorldEntity } from "../src/game/world/world.js";

function runToCompletion(controller, operationId) {
  while (controller.getSnapshot().operations[operationId].status === "running") {
    controller.tick();
  }
}

test("the market sells a one-slot station for 400g", () => {
  const state = createFarmState();
  state.money = 500;
  state.world.entities.player.position = { x: 18, y: 12 };

  const result = buyItem(state, "player", "recharge_station");

  assert.equal(result.code, "ITEM_BOUGHT");
  assert.equal(result.totalPrice, 400);
  assert.equal(state.money, 100);
  assert.ok(state.world.entities.player.inventory.some(
    (stack) => stack?.itemId === "recharge_station" && stack.quantity === 1,
  ));
});

test("a purchased station item places a full blocking charger", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  player.inventory[4] = { itemId: "recharge_station", quantity: 1 };
  const target = { mapId: "farm", x: 5, y: 6 };

  assert.equal(useItem(state, "player", target, { itemId: "recharge_station" }).code, "ITEM_USED");
  const station = Object.values(state.world.entities).find(
    (entity) => entity.type === "recharge_station",
  );
  assert.deepEqual(station.position, target);
  assert.equal(station.charge, 40);
  assert.equal(station.capacity, 40);
  assert.equal(player.inventory[4], null);
});

test("placement rejects occupied and cultivated tiles without consuming the item", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  player.inventory[4] = { itemId: "recharge_station", quantity: 1 };

  assert.equal(
    useItem(state, "player", { x: 4, y: 5 }, { itemId: "recharge_station" }).code,
    "INVALID_PLACEMENT_TARGET",
  );
  state.world.maps.farm.terrain[4][5] = "tilled";
  assert.equal(
    useItem(state, "player", { x: 5, y: 4 }, { itemId: "recharge_station" }).code,
    "INVALID_PLACEMENT_TARGET",
  );
  assert.equal(player.inventory[4].quantity, 1);
});

test("robot recharge transfers only the needed or available station charge", () => {
  const state = createFarmState();
  const robot = state.world.entities.robot;
  robot.sleeping = false;
  robot.position = { x: 7, y: 6 };
  robot.stamina = 8;
  const station = createRechargeStation({
    id: "recharge-station-test",
    position: { x: 8, y: 6 },
    charge: 5,
  });
  addWorldEntity(state.world, station);
  const controller = createController(state);
  const submission = controller.submit({
    type: "interact_at",
    actorId: "robot",
    target: { x: 8, y: 6 },
  });

  assert.equal(submission.success, true);
  assert.deepEqual(state.operations[submission.operationId].command.item, { action: "recharge" });
  runToCompletion(controller, submission.operationId);
  assert.equal(robot.stamina, 13);
  assert.equal(station.charge, 0);
});

test("solar stations refill to capacity at day begin", () => {
  const state = createFarmState();
  const station = createRechargeStation({
    id: "recharge-station-test",
    position: { x: 8, y: 6 },
    charge: 3,
  });
  addWorldEntity(state.world, station);
  const player = state.world.entities.player;
  player.mapId = "farmhouse";
  player.position = { x: 1, y: 3 };

  assert.equal(sleepActor(state, "player").code, "DAY_ADVANCED");
  assert.equal(station.charge, 40);
  assert.ok(state.history.some(
    (event) => event.type === "station_solar_refilled"
      && event.entityId === station.id
      && event.previousCharge === 3
      && event.charge === 40,
  ));
});

test("player and WebMCP inspection expose station charge and spatial access", () => {
  const state = createFarmState();
  const robot = state.world.entities.robot;
  robot.position = { x: 7, y: 6 };
  const station = createRechargeStation({
    id: "recharge-station-test",
    position: { x: 8, y: 6 },
    charge: 17,
  });
  addWorldEntity(state.world, station);

  const playerView = inspectLocation(state, "player", { x: 8, y: 6 }).entities[0];
  assert.deepEqual(
    { charge: playerView.charge, capacity: playerView.capacity, canRecharge: playerView.canRecharge },
    { charge: 17, capacity: 40, canRecharge: false },
  );

  const agentView = inspectGame(createController(state), {
    x: 8,
    y: 6,
    radius: 1,
    entityTypes: ["recharge_station"],
  });
  assert.match(agentView.view.ascii, /E/);
  assert.deepEqual(
    {
      charge: agentView.entities[0].charge,
      capacity: agentView.entities[0].capacity,
      canRecharge: agentView.entities[0].canRecharge,
    },
    { charge: 17, capacity: 40, canRecharge: true },
  );
});