import assert from "node:assert/strict";
import test from "node:test";

import { createController } from "../src/application/controller.js";
import { GAME_CONFIG } from "../src/game/config.js";
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
    assert.deepEqual(controller.getSnapshot().actors[actorId].position, { x: 1, y: 4 });
    const ticks = runToCompletion(controller, submission.operationId);
    assert.equal(ticks, 3);
    assert.deepEqual(controller.getSnapshot().actors[actorId].position, { x: 3, y: 4 });
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
      actor: state.actors[actorId],
      tree: state.world.objects["4,4"],
    };
  });

  assert.equal(results[0].ticks, results[1].ticks);
  assert.equal(results[0].ticks, 6);
  assert.deepEqual(results[0].actor.position, results[1].actor.position);
  assert.equal(results[0].actor.stamina, GAME_CONFIG.maxStamina - 2);
  assert.equal(results[0].tree.hitPoints, GAME_CONFIG.treeHitPoints - 1);
  assert.equal(results[0].operation.result.code, "INTERACTION_COMPLETE");
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
  state.world.objects["3,4"] = { type: "rock", x: 3, y: 4 };
  state.world.objects["4,3"] = { type: "rock", x: 4, y: 3 };
  state.world.objects["5,4"] = { type: "rock", x: 5, y: 4 };
  state.world.objects["4,5"] = { type: "rock", x: 4, y: 5 };
  const controller = createController(state);

  const result = controller.submit({
    type: "interact_at",
    actorId: "player",
    target: { x: 4, y: 4 },
    item: { itemId: "axe" },
  });

  assert.equal(result.success, false);
  assert.equal(result.code, "INTERACTION_UNREACHABLE");
  assert.equal(state.actors.player.stamina, GAME_CONFIG.maxStamina);
  assert.deepEqual(state.operations, {});
});
