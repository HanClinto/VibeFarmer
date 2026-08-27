import assert from "node:assert/strict";
import test from "node:test";

import { sleepActor } from "../src/game/actions/actions.js";
import { GAME_CONFIG } from "../src/game/config.js";
import { createFarmState } from "../src/game/farm.js";
import { createGameState } from "../src/game/state.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { addWorldEntity } from "../src/game/world/world.js";

function addPlayerBed(state, position = { x: 1, y: 2 }) {
  addWorldEntity(state.world, {
    id: "bed-player",
    type: "bed",
    actorId: "player",
    position,
  });
}

test("day_end grows watered crops before day_begin dries soil and restores actors", () => {
  const state = createGameState();
  const player = state.world.entities.player;
  const robot = state.world.entities.robot;
  player.stamina = 3;
  robot.stamina = 4;
  addPlayerBed(state);
  state.world.terrain[3][3] = "wet_tilled";
  addWorldEntity(state.world, createPlant({
    id: "plant-turnip",
    cropType: "turnip",
    position: { x: 3, y: 3 },
  }));

  const result = sleepActor(state, "player");

  assert.equal(result.code, "DAY_ADVANCED");
  assert.equal(state.day, 2);
  assert.equal(state.world.entities["plant-turnip"].growthStage, 1);
  assert.equal(state.world.terrain[3][3], "tilled");
  assert.equal(player.stamina, GAME_CONFIG.maxStamina);
  assert.equal(robot.stamina, GAME_CONFIG.maxStamina);
  assert.equal(player.sleeping, false);
  assert.equal(robot.sleeping, true);
  assert.deepEqual(
    state.history.filter((event) => ["day_end", "crop_grew", "day_begin"].includes(event.type))
      .map((event) => event.type),
    ["day_end", "crop_grew", "day_begin"],
  );
});

test("an unwatered crop does not grow", () => {
  const state = createGameState();
  addPlayerBed(state);
  state.world.terrain[2][2] = "tilled";
  addWorldEntity(state.world, createPlant({
    id: "plant-dry",
    cropType: "turnip",
    position: { x: 2, y: 2 },
  }));

  sleepActor(state, "player");

  assert.equal(state.world.entities["plant-dry"].growthStage, 0);
});

test("plant handlers run in stable entity-id order", () => {
  const state = createGameState();
  addPlayerBed(state);
  state.world.terrain[2][2] = "wet_tilled";
  state.world.terrain[2][3] = "wet_tilled";
  addWorldEntity(state.world, createPlant({
    id: "plant-z",
    cropType: "turnip",
    position: { x: 3, y: 2 },
  }));
  addWorldEntity(state.world, createPlant({
    id: "plant-a",
    cropType: "turnip",
    position: { x: 2, y: 2 },
  }));

  sleepActor(state, "player");

  assert.deepEqual(
    state.history.filter((event) => event.type === "crop_grew")
      .map((event) => event.entityId),
    ["plant-a", "plant-z"],
  );
});

test("sleep requires the actor's adjacent bed on the same map", () => {
  const state = createGameState();
  assert.equal(sleepActor(state, "player").code, "BED_REQUIRED");

  addPlayerBed(state, { x: 5, y: 5 });
  assert.equal(sleepActor(state, "player").code, "BED_NOT_ADJACENT");
  state.world.entities["bed-player"].mapId = "farmhouse";
  state.world.maps.farmhouse = {
    id: "farmhouse",
    width: 6,
    height: 6,
    terrain: Array.from({ length: 6 }, () => Array(6).fill("floor")),
  };
  state.world.entities.player.position = { x: 5, y: 4 };
  assert.equal(sleepActor(state, "player").code, "BED_NOT_ADJACENT");
});

test("canonical player bed and robot berth apply the same sleep rule", () => {
  const state = createFarmState();
  const player = state.world.entities.player;
  const robot = state.world.entities.robot;
  player.mapId = "farmhouse";
  player.position = { x: 1, y: 3 };
  robot.sleeping = false;
  robot.mapId = "farmhouse";
  robot.position = { x: 5, y: 3 };

  assert.equal(sleepActor(state, "player").code, "WAITING_FOR_OTHER_ACTORS");
  assert.equal(sleepActor(state, "robot").code, "DAY_ADVANCED");
  assert.equal(state.day, 2);
});