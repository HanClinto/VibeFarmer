import { GAME_CONFIG } from "./config.js";
import { getActor, moveStep, useItem } from "./actions/actions.js";
import { getWorldEntitiesByType } from "./world/world.js";
import { replanOperation } from "./world/entities/actors/intents.js";

const TERMINAL_STATUSES = new Set(["completed", "failed", "cancelled"]);

function finishOperation(state, operation, status, code, details = {}) {
  operation.status = status;
  operation.completedTick = state.tick;
  operation.result = { success: status === "completed", code, ...details };
  getActor(state, operation.actorId).activeIntent = null;
  state.history.push({
    type: `intent_${status}`,
    operationId: operation.operationId,
    actorId: operation.actorId,
    tick: state.tick,
    code,
  });
}

function advanceMovement(state, operation) {
  if (operation.path.length === 0) {
    if (operation.command.type === "move_to") {
      finishOperation(state, operation, "completed", "DESTINATION_REACHED", {
        position: { ...getActor(state, operation.actorId).position },
      });
    } else {
      operation.phase = "working";
      operation.cooldown = GAME_CONFIG.workCooldownTicks;
    }
    return;
  }

  let result = moveStep(state, operation.actorId, operation.path[0]);
  if (!result.success && replanOperation(state, operation)) {
    if (operation.phase === "working") return;
    result = operation.path.length > 0
      ? moveStep(state, operation.actorId, operation.path[0])
      : { success: true, code: "PATH_COMPLETE" };
  }
  if (!result.success) {
    finishOperation(state, operation, "failed", "INTERACTION_REPLAN_FAILED", {
      cause: result.code,
    });
    return;
  }

  if (operation.path.length > 0) operation.path.shift();
  if (operation.path.length === 0) {
    if (operation.command.type === "move_to") {
      finishOperation(state, operation, "completed", "DESTINATION_REACHED", {
        position: { ...getActor(state, operation.actorId).position },
      });
    } else {
      operation.phase = "working";
      operation.cooldown = GAME_CONFIG.workCooldownTicks;
    }
  } else {
    operation.cooldown = GAME_CONFIG.movementCooldownTicks;
  }
}

function advanceWork(state, operation) {
  const result = useItem(
    state,
    operation.actorId,
    operation.command.target,
    operation.command.item,
  );
  if (!result.success) {
    finishOperation(state, operation, "failed", result.code);
    return;
  }

  finishOperation(state, operation, "completed", "INTERACTION_COMPLETE", {
    action: result,
    position: { ...getActor(state, operation.actorId).position },
    replanned: operation.replanCount > 0,
  });
}

function advanceOperation(state, operation) {
  if (TERMINAL_STATUSES.has(operation.status)) return;
  if (operation.cancellationRequested) {
    finishOperation(state, operation, "cancelled", "INTENT_CANCELLED");
    return;
  }
  if (operation.cooldown > 0) {
    operation.cooldown -= 1;
    return;
  }

  if (operation.phase === "moving") advanceMovement(state, operation);
  else if (operation.phase === "working") advanceWork(state, operation);
}

export function tick(state) {
  state.tick += 1;
  const actors = getWorldEntitiesByType(state.world, "actor")
    .sort((first, second) => first.id.localeCompare(second.id));
  for (const actor of actors) {
    const operationId = actor.activeIntent;
    if (operationId) advanceOperation(state, state.operations[operationId]);
  }
  return state;
}

export function isOperationTerminal(operation) {
  return TERMINAL_STATUSES.has(operation.status);
}