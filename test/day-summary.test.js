import assert from "node:assert/strict";
import test from "node:test";

import {
  buyItem,
  harvest,
  moveStep,
  sellItem,
  sleepActor,
  useItem,
} from "../src/game/actions/actions.js";
import { createFarmState } from "../src/game/farm.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { addItem } from "../src/game/world/entities/containers/inventory.js";
import { addWorldEntity } from "../src/game/world/world.js";

test("day advance returns complete player and robot activity statistics", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  const robot = state.world.entities.robot;
  robot.sleeping = false;

  moveStep(state, "player", { x: 5, y: 6 });
  moveStep(state, "robot", { x: 6, y: 6 });
  useItem(state, "player", { x: 5, y: 7 }, { itemId: "hoe" });
  addWorldEntity(state.world, createPlant({
    id: "summary-turnip",
    cropType: "turnip",
    position: { x: 6, y: 7 },
  }));
  state.world.entities["summary-turnip"].growthStage = 3;
  harvest(state, "robot", { x: 6, y: 7 });
  addItem(player.inventory, "logs", 1);
  sellItem(state, "player", "logs", 1);
  buyItem(state, "robot", "turnip_seeds", 1);

  player.mapId = "farmhouse";
  player.position = { x: 1, y: 3 };
  robot.mapId = "farmhouse";
  robot.position = { x: 5, y: 3 };
  assert.equal(sleepActor(state, "player").code, "WAITING_FOR_OTHER_ACTORS");
  const result = sleepActor(state, "robot");

  assert.equal(result.code, "DAY_ADVANCED");
  assert.deepEqual(result.summary.actors.player, {
    tilesTraversed: 1,
    actionsTaken: 2,
    toolUses: 1,
    cropsHarvested: 0,
    itemsBought: 0,
    itemsSold: 1,
    itemsTransferred: 0,
  });
  assert.deepEqual(result.summary.actors.robot, {
    tilesTraversed: 1,
    actionsTaken: 2,
    toolUses: 0,
    cropsHarvested: 1,
    itemsBought: 1,
    itemsSold: 0,
    itemsTransferred: 0,
  });
  assert.equal(result.summary.world.cropsHarvested, 1);
  assert.equal(result.summary.world.moneyEarned, 5);
  assert.equal(result.summary.world.moneySpent, 5);
  assert.equal(result.summary.endingBalance, state.money);
  assert.deepEqual(state.lastDaySummary, result.summary);
  assert.equal(state.dayStats.day, 2);
  assert.equal(state.dayStats.actors.player.tilesTraversed, 0);
});