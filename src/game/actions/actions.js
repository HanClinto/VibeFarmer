import { CARDINAL_DIRECTIONS, GAME_CONFIG } from "../config.js";
import {
  getWorldEntitiesByType,
  getWorldEntity,
  getWorldObject,
  isInBounds,
  removeWorldEntity,
} from "../world/world.js";

function outcome(success, code, details = {}) {
  return { success, code, ...details };
}

export function getActor(state, actorId) {
  const entity = getWorldEntity(state.world, actorId);
  return entity?.type === "actor" ? entity : null;
}

export function isAdjacent(first, second) {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
}

export function isWalkable(state, position, actorId) {
  if (!isInBounds(state.world, position) || getWorldObject(state.world, position)) {
    return false;
  }

  return !getWorldEntitiesByType(state.world, "actor").some(
    (actor) => actor.id !== actorId
      && actor.position.x === position.x
      && actor.position.y === position.y,
  );
}

export function resolveItem(actor, selector = {}) {
  let slotIndex;

  if (selector.slot !== undefined) {
    slotIndex = selector.slot - 1;
  } else if (selector.itemId) {
    slotIndex = actor.inventory.findIndex((item) => item?.itemId === selector.itemId);
  } else {
    slotIndex = actor.selectedSlot - 1;
  }

  const item = actor.inventory[slotIndex] ?? null;
  if (!item) return outcome(false, "ITEM_NOT_FOUND");

  return outcome(true, "ITEM_RESOLVED", {
    slot: slotIndex + 1,
    item,
  });
}

export function selectSlot(state, actorId, slot) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!Number.isInteger(slot) || slot < 1 || slot > actor.inventory.length) {
    return outcome(false, "INVALID_INVENTORY_SLOT");
  }

  actor.selectedSlot = slot;
  return outcome(true, "SLOT_SELECTED", { actorId, slot });
}

export function validateUseItem(state, actorId, target, selector, { requireAdjacent = true } = {}) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!isInBounds(state.world, target)) return outcome(false, "TARGET_OUT_OF_BOUNDS");
  if (requireAdjacent && !isAdjacent(actor.position, target)) {
    return outcome(false, "TARGET_NOT_ADJACENT");
  }

  const resolved = resolveItem(actor, selector);
  if (!resolved.success) return resolved;

  const targetObject = getWorldObject(state.world, target);
  if (resolved.item.itemId === "axe" && targetObject?.type !== "tree") {
    return outcome(false, "INVALID_AXE_TARGET");
  }
  if (resolved.item.itemId === "hoe" && targetObject) {
    return outcome(false, "INVALID_HOE_TARGET");
  }

  const staminaCost = GAME_CONFIG.staminaCosts[resolved.item.itemId] ?? 0;
  if (actor.stamina < staminaCost) return outcome(false, "NOT_ENOUGH_STAMINA");

  return outcome(true, "ITEM_USE_VALID", {
    actor,
    item: resolved.item,
    slot: resolved.slot,
    staminaCost,
    targetObject,
  });
}

function addHistory(state, event) {
  state.history.push(event);
  if (state.history.length > 200) state.history.shift();
}

export function moveStep(state, actorId, target) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!isAdjacent(actor.position, target)) return outcome(false, "INVALID_MOVE_DISTANCE");
  if (!isWalkable(state, target, actorId)) return outcome(false, "MOVE_BLOCKED");

  const direction = CARDINAL_DIRECTIONS.find(
    ({ x, y }) => actor.position.x + x === target.x && actor.position.y + y === target.y,
  );
  const previousPosition = { ...actor.position };
  actor.position = { ...target };
  actor.facing = direction.name;
  actor.motion = {
    from: previousPosition,
    to: { ...target },
    startedTick: state.tick,
  };
  actor.sleeping = false;
  addHistory(state, { type: "move", actorId, target: { ...target } });
  return outcome(true, "MOVED", { position: { ...actor.position } });
}

export function useItem(state, actorId, target, selector = {}) {
  const validation = validateUseItem(state, actorId, target, selector);
  if (!validation.success) return validation;

  const { actor, item, slot, staminaCost, targetObject } = validation;
  actor.stamina -= staminaCost;
  actor.sleeping = false;

  if (item.itemId === "axe") {
    targetObject.hitPoints -= 1;
    if (targetObject.hitPoints <= 0) removeWorldEntity(state.world, targetObject.id);
  } else if (item.itemId === "hoe") {
    state.world.terrain[target.y][target.x] = "tilled";
  }

  addHistory(state, {
    type: "use_item",
    actorId,
    itemId: item.itemId,
    slot,
    target: { ...target },
  });
  return outcome(true, "ITEM_USED", {
    itemId: item.itemId,
    slot,
    target: { ...target },
    staminaCost,
  });
}