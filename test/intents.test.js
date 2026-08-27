import assert from "node:assert/strict";
import test from "node:test";

import { GAME_CONFIG } from "../src/game/config.js";
import { interactAt, moveTo } from "../src/game/world/entities/actors/intents.js";
import { createGameState } from "../src/game/state.js";
import { createWorld } from "../src/game/world/world.js";

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
  state.actors[actorId].position = { x: 1, y: 4 };
  state.actors[actorId].sleeping = false;
  state.actors[actorId === "player" ? "robot" : "player"].position = { x: 0, y: 0 };
  return state;
}

test("moveTo uses deterministic A* for either actor", () => {
  for (const actorId of ["player", "robot"]) {
    const state = createParityState(actorId);
    const result = moveTo(state, actorId, { x: 3, y: 4 });

    assert.equal(result.success, true);
    assert.deepEqual(result.path, [{ x: 2, y: 4 }, { x: 3, y: 4 }]);
    assert.deepEqual(state.actors[actorId].position, { x: 3, y: 4 });
  }
});

test("interactAt has identical path and effects for player and robot", () => {
  const results = ["player", "robot"].map((actorId) => {
    const state = createParityState(actorId);
    const result = interactAt(state, actorId, { x: 4, y: 4 }, { itemId: "axe" });
    return {
      result,
      actor: state.actors[actorId],
      tree: state.world.objects["4,4"],
      history: state.history,
    };
  });

  assert.deepEqual(results[0].result, results[1].result);
  assert.deepEqual(results[0].actor.position, { x: 3, y: 4 });
  assert.equal(results[0].actor.stamina, GAME_CONFIG.maxStamina - 2);
  assert.equal(results[0].tree.hitPoints, GAME_CONFIG.treeHitPoints - 1);
  assert.deepEqual(
    results[0].history.map(({ actorId, ...event }) => event),
    results[1].history.map(({ actorId, ...event }) => event),
  );
});

test("interactAt resolves either a slot or stable item id to one use", () => {
  const bySlot = createParityState("robot");
  const byId = createParityState("robot");

  const slotResult = interactAt(bySlot, "robot", { x: 4, y: 4 }, { slot: 1 });
  const idResult = interactAt(byId, "robot", { x: 4, y: 4 }, { itemId: "axe" });

  assert.equal(slotResult.success, true);
  assert.equal(idResult.success, true);
  assert.equal(slotResult.action.slot, 1);
  assert.equal(idResult.action.slot, 1);
  assert.equal(bySlot.world.objects["4,4"].hitPoints, GAME_CONFIG.treeHitPoints - 1);
  assert.equal(byId.world.objects["4,4"].hitPoints, GAME_CONFIG.treeHitPoints - 1);
});

test("failed smart interaction does not spend stamina", () => {
  const state = createParityState("player");
  state.world.objects["3,4"] = { type: "rock", x: 3, y: 4 };
  state.world.objects["4,3"] = { type: "rock", x: 4, y: 3 };
  state.world.objects["5,4"] = { type: "rock", x: 5, y: 4 };
  state.world.objects["4,5"] = { type: "rock", x: 4, y: 5 };

  const result = interactAt(state, "player", { x: 4, y: 4 }, { itemId: "axe" });

  assert.equal(result.success, false);
  assert.equal(result.code, "INTERACTION_UNREACHABLE");
  assert.equal(state.actors.player.stamina, GAME_CONFIG.maxStamina);
  assert.equal(state.world.objects["4,4"].hitPoints, GAME_CONFIG.treeHitPoints);
});