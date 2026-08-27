import { CARDINAL_DIRECTIONS, GAME_CONFIG } from "../config.js";
import { dispatchLifecycleEvent } from "../events.js";
import { addItem, canAddItem } from "../world/entities/containers/inventory.js";
import { removeItem } from "../world/entities/containers/inventory.js";
import { getItemType } from "../world/entities/items/item-types.js";
import { createPlant } from "../world/entities/plants/plants.js";
import { getTerrainAt, setTerrainAt } from "../world/terrain/terrain.js";
import {
  addWorldEntity,
  generateWorldEntityId,
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
  const terrainType = getTerrainAt(state.world, target);
  if (resolved.item.itemId === "axe" && targetObject?.type !== "tree") {
    return outcome(false, "INVALID_AXE_TARGET");
  }
  if (resolved.item.itemId === "axe" && targetObject?.hitPoints === 1
    && !canAddItem(actor.inventory, "logs", 2)) {
    return outcome(false, "INVENTORY_FULL");
  }
  if (resolved.item.itemId === "hoe" && (targetObject || terrainType !== "grass")) {
    return outcome(false, "INVALID_HOE_TARGET");
  }
  if (resolved.item.itemId === "watering_can" && terrainType !== "tilled") {
    return outcome(false, "INVALID_WATER_TARGET");
  }
  if (resolved.item.itemId === "turnip_seeds"
    && (targetObject || !["tilled", "wet_tilled"].includes(terrainType))) {
    return outcome(false, "INVALID_PLANT_TARGET");
  }

  const staminaCost = GAME_CONFIG.staminaCosts[resolved.item.itemId] ?? 0;
  if (actor.stamina < staminaCost) return outcome(false, "NOT_ENOUGH_STAMINA");

  return outcome(true, "ITEM_USE_VALID", {
    actor,
    item: resolved.item,
    slot: resolved.slot,
    staminaCost,
    targetObject,
    terrainType,
  });
}

export function validateHarvest(state, actorId, target, { requireAdjacent = true } = {}) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!isInBounds(state.world, target)) return outcome(false, "TARGET_OUT_OF_BOUNDS");
  if (requireAdjacent && !isAdjacent(actor.position, target)) {
    return outcome(false, "TARGET_NOT_ADJACENT");
  }

  const plant = getWorldObject(state.world, target);
  if (plant?.type !== "plant" || plant.growthStage < plant.matureStage) {
    return outcome(false, "CROP_NOT_READY");
  }
  if (!canAddItem(actor.inventory, plant.cropType, 1)) {
    return outcome(false, "INVENTORY_FULL");
  }
  return outcome(true, "HARVEST_VALID", { actor, plant });
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
    durationTicks: GAME_CONFIG.movementCooldownTicks + 1,
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
    if (targetObject.hitPoints <= 0) {
      addItem(actor.inventory, "logs", 2);
      removeWorldEntity(state.world, targetObject.id);
    }
  } else if (item.itemId === "hoe") {
    setTerrainAt(state.world, target, "tilled");
  } else if (item.itemId === "watering_can") {
    setTerrainAt(state.world, target, "wet_tilled");
  } else if (item.itemId === "turnip_seeds") {
    addWorldEntity(state.world, createPlant({
      id: generateWorldEntityId(state.world, "plant"),
      cropType: "turnip",
      position: target,
    }));
    item.quantity -= 1;
    if (item.quantity === 0) actor.inventory[slot - 1] = null;
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

export function harvest(state, actorId, target) {
  const validation = validateHarvest(state, actorId, target);
  if (!validation.success) return validation;

  const { actor, plant } = validation;
  addItem(actor.inventory, plant.cropType, 1);
  removeWorldEntity(state.world, plant.id);
  addHistory(state, {
    type: "crop_harvested",
    actorId,
    entityId: plant.id,
    cropType: plant.cropType,
    target: { ...target },
  });
  return outcome(true, "CROP_HARVESTED", {
    cropType: plant.cropType,
    quantity: 1,
    target: { ...target },
  });
}

export function sleepActor(state, actorId) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (actor.activeIntent) return outcome(false, "ACTOR_BUSY", { operationId: actor.activeIntent });
  actor.sleeping = true;
  addHistory(state, { type: "actor_slept", actorId, tick: state.tick, day: state.day });

  const actors = getWorldEntitiesByType(state.world, "actor");
  if (!actors.every((candidate) => candidate.sleeping)) {
    return outcome(true, "WAITING_FOR_OTHER_ACTORS", { actorId });
  }

  dispatchLifecycleEvent(state, "day_end");
  state.day += 1;
  dispatchLifecycleEvent(state, "day_begin");
  return outcome(true, "DAY_ADVANCED", { day: state.day });
}

export function buyItem(state, actorId, itemId, quantity = 1) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  const itemType = getItemType(itemId);
  if (!itemType?.buyPrice) return outcome(false, "ITEM_NOT_FOR_SALE");
  if (!Number.isInteger(quantity) || quantity < 1) return outcome(false, "INVALID_QUANTITY");
  const totalPrice = itemType.buyPrice * quantity;
  if (state.money < totalPrice) return outcome(false, "NOT_ENOUGH_MONEY");
  if (!canAddItem(actor.inventory, itemId, quantity)) return outcome(false, "INVENTORY_FULL");

  addItem(actor.inventory, itemId, quantity);
  state.money -= totalPrice;
  addHistory(state, { type: "item_bought", actorId, itemId, quantity, totalPrice });
  return outcome(true, "ITEM_BOUGHT", { itemId, quantity, totalPrice, money: state.money });
}

export function sellItem(state, actorId, itemId, quantity = 1) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  const itemType = getItemType(itemId);
  if (!itemType?.sellPrice) return outcome(false, "ITEM_NOT_SELLABLE");
  if (!Number.isInteger(quantity) || quantity < 1) return outcome(false, "INVALID_QUANTITY");
  if (!removeItem(actor.inventory, itemId, quantity)) return outcome(false, "ITEM_NOT_FOUND");

  const totalPrice = itemType.sellPrice * quantity;
  state.money += totalPrice;
  addHistory(state, { type: "item_sold", actorId, itemId, quantity, totalPrice });
  return outcome(true, "ITEM_SOLD", { itemId, quantity, totalPrice, money: state.money });
}