import { CARDINAL_DIRECTIONS } from "./config.js";
import {
  getActor,
  isWalkable,
  moveStep,
  useItem,
  validateUseItem,
} from "./actions.js";
import { findPath } from "./pathfinding.js";

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

function followPath(state, actorId, path) {
  for (const step of path) {
    const result = moveStep(state, actorId, step);
    if (!result.success) return result;
  }
  return outcome(true, "PATH_COMPLETE", { steps: path.length });
}

export function moveTo(state, actorId, target) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");

  const path = pathTo(state, actorId, target);
  if (!path) return outcome(false, "DESTINATION_UNREACHABLE");

  const result = followPath(state, actorId, path);
  if (!result.success) return result;
  return outcome(true, "DESTINATION_REACHED", {
    path,
    position: { ...actor.position },
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

export function interactAt(state, actorId, target, selector = {}) {
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

  const movement = followPath(state, actorId, route.path);
  if (!movement.success) {
    const replannedRoute = interactionRoute(state, actorId, target);
    if (!replannedRoute) return outcome(false, "INTERACTION_REPLAN_FAILED");
    const replannedMovement = followPath(state, actorId, replannedRoute.path);
    if (!replannedMovement.success) return outcome(false, "INTERACTION_REPLAN_FAILED");
  }

  const useResult = useItem(state, actorId, target, selector);
  if (!useResult.success) return useResult;

  const actor = getActor(state, actorId);
  return outcome(true, "INTERACTION_COMPLETE", {
    path: route.path,
    replanned: !movement.success,
    position: { ...actor.position },
    action: useResult,
  });
}