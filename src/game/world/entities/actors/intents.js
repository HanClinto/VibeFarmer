import { CARDINAL_DIRECTIONS, GAME_CONFIG } from "../../../config.js";
import {
  getActor,
  isWalkable,
  validateUseItem,
} from "../../../actions/actions.js";
import { findPath } from "../../pathfinding.js";

function outcome(success, code, details = {}) {
  return { success, code, ...details };
}

function pathTo(state, actorId, target) {
  const actor = getActor(state, actorId);
  return findPath(
    actor.position,
    target,
    (position) => isWalkable(state, position, actorId),
  );
}

function validateAvailableActor(state, actorId) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (actor.activeIntent) {
    return outcome(false, "ACTOR_BUSY", { operationId: actor.activeIntent });
  }
  return outcome(true, "ACTOR_AVAILABLE");
}

function createOperation(state, actorId, command, details) {
  const operationId = `operation-${state.nextOperationId}`;
  state.nextOperationId += 1;
  state.operations[operationId] = {
    operationId,
    actorId,
    command,
    status: "running",
    submittedTick: state.tick,
    completedTick: null,
    result: null,
    cancellationRequested: false,
    replanCount: 0,
    cooldown: 0,
    ...details,
  };
  const actor = getActor(state, actorId);
  actor.activeIntent = operationId;
  actor.sleeping = false;
  return outcome(true, "INTENT_SUBMITTED", { operationId });
}

export function submitMoveTo(state, actorId, target) {
  const available = validateAvailableActor(state, actorId);
  if (!available.success) return available;

  const path = pathTo(state, actorId, target);
  if (!path) return outcome(false, "DESTINATION_UNREACHABLE");

  return createOperation(state, actorId, {
    type: "move_to",
    target: { ...target },
  }, {
    phase: "moving",
    path,
  });
}

function interactionRoute(state, actorId, target) {
  const candidates = CARDINAL_DIRECTIONS.map((direction, tieBreak) => ({
    position: { x: target.x + direction.x, y: target.y + direction.y },
    tieBreak,
  }))
    .filter(({ position }) => isWalkable(state, position, actorId))
    .map((candidate) => ({
      ...candidate,
      path: pathTo(state, actorId, candidate.position),
    }))
    .filter(({ path }) => path !== null)
    .sort((first, second) => first.path.length - second.path.length
      || first.tieBreak - second.tieBreak);

  return candidates[0] ?? null;
}

export function submitInteractAt(state, actorId, target, selector = {}) {
  const available = validateAvailableActor(state, actorId);
  if (!available.success) return available;

  const validation = validateUseItem(
    state,
    actorId,
    target,
    selector,
    { requireAdjacent: false },
  );
  if (!validation.success) return validation;

  const route = interactionRoute(state, actorId, target);
  if (!route) return outcome(false, "INTERACTION_UNREACHABLE");

  return createOperation(state, actorId, {
    type: "interact_at",
    target: { ...target },
    item: { ...selector },
  }, {
    phase: route.path.length > 0 ? "moving" : "working",
    path: route.path,
    cooldown: route.path.length > 0 ? 0 : GAME_CONFIG.workCooldownTicks,
  });
}

export function replanOperation(state, operation) {
  if (operation.replanCount >= 1) return false;
  operation.replanCount += 1;

  if (operation.command.type === "move_to") {
    const path = pathTo(state, operation.actorId, operation.command.target);
    if (!path) return false;
    operation.path = path;
    return true;
  }

  const route = interactionRoute(state, operation.actorId, operation.command.target);
  if (!route) return false;
  operation.path = route.path;
  if (route.path.length === 0) {
    operation.phase = "working";
    operation.cooldown = GAME_CONFIG.workCooldownTicks;
  }
  return true;
}