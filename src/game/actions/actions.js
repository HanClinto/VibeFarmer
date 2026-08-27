import { CARDINAL_DIRECTIONS, GAME_CONFIG } from "../config.js";
import { createDayStats, finalizeDaySummary, recordDayEvent } from "../day-summary.js";
import { dispatchLifecycleEvent } from "../events.js";
import {
  addItem,
  canAddItem,
  getAddableQuantity,
  getItemQuantity,
  removeItem,
} from "../world/entities/containers/inventory.js";
import { getItemType } from "../world/entities/items/item-types.js";
import { createPlant } from "../world/entities/plants/plants.js";
import { createRechargeStation } from "../world/entities/structures/recharge-stations.js";
import {
  deterministicHarvestQuantity,
  getCropType,
  getCropTypeBySeed,
} from "../world/entities/plants/crop-types.js";
import { TERRAIN_TYPES, getTerrainAt, setTerrainAt } from "../world/terrain/terrain.js";
import {
  addWorldEntity,
  generateWorldEntityId,
  getBlockingWorldObject,
  getEntityLocation,
  getWorldEntitiesAt,
  getWorldEntitiesByType,
  getWorldEntity,
  getWorldObject,
  isInBounds,
  normalizeLocation,
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
  return (first.mapId === undefined || second.mapId === undefined || first.mapId === second.mapId)
    && Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
}

export function normalizeActorTarget(state, actor, target) {
  return normalizeLocation(state.world, target, actor.mapId);
}

export function isWalkable(state, position, actorId) {
  const actor = getActor(state, actorId);
  if (!actor) return false;
  const target = normalizeActorTarget(state, actor, position);
  if (target.mapId !== actor.mapId
    || !isInBounds(state.world, target)
    || getBlockingWorldObject(state.world, target)) {
    return false;
  }
  if (!TERRAIN_TYPES[getTerrainAt(state.world, target)]?.passable) return false;

  return !getWorldEntitiesByType(state.world, "actor", actor.mapId).some(
    (actor) => actor.id !== actorId
      && actor.position.x === target.x
      && actor.position.y === target.y,
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
  target = normalizeActorTarget(state, actor, target);
  if (target.mapId !== actor.mapId) return outcome(false, "TARGET_DIFFERENT_MAP");
  if (!isInBounds(state.world, target)) return outcome(false, "TARGET_OUT_OF_BOUNDS");
  if (requireAdjacent && !isAdjacent(getEntityLocation(actor), target)) {
    return outcome(false, "TARGET_NOT_ADJACENT");
  }

  const resolved = resolveItem(actor, selector);
  if (!resolved.success) return resolved;

  const targetObject = getWorldObject(state.world, target);
  const terrainType = getTerrainAt(state.world, target);
  const seedCrop = getCropTypeBySeed(resolved.item.itemId);
  const itemType = getItemType(resolved.item.itemId);
  if (resolved.item.itemId === "axe" && targetObject?.type !== "tree") {
    return outcome(false, "INVALID_AXE_TARGET");
  }
  if (resolved.item.itemId === "axe" && targetObject?.hitPoints === 1
    && !canAddItem(actor.inventory, "logs", 2)) {
    return outcome(false, "INVENTORY_FULL");
  }
  if (resolved.item.itemId === "hoe") {
    const validBareGround = !targetObject && terrainType === "grass";
    const validCrop = targetObject?.type === "plant"
      && ["tilled", "wet_tilled"].includes(terrainType);
    if (!validBareGround && !validCrop) return outcome(false, "INVALID_HOE_TARGET");
    if (validCrop && targetObject.growthStage === 0
      && !canAddItem(actor.inventory, getCropType(targetObject.cropType).seedItemId, 1)) {
      return outcome(false, "INVENTORY_FULL");
    }
  }
  if (resolved.item.itemId === "watering_can" && terrainType !== "tilled") {
    return outcome(false, "INVALID_WATER_TARGET");
  }
  if (seedCrop
    && (targetObject || !["tilled", "wet_tilled"].includes(terrainType))) {
    return outcome(false, "INVALID_PLANT_TARGET");
  }
  if (itemType?.category === "placeable") {
    const occupied = getWorldEntitiesAt(state.world, target).length > 0;
    if (occupied || !["grass", "path"].includes(terrainType)) {
      return outcome(false, "INVALID_PLACEMENT_TARGET");
    }
  }

  const staminaCost = GAME_CONFIG.staminaCosts[resolved.item.itemId] ?? (seedCrop ? 1 : 0);
  if (actor.stamina < staminaCost) return outcome(false, "NOT_ENOUGH_STAMINA");

  return outcome(true, "ITEM_USE_VALID", {
    actor,
    item: resolved.item,
    slot: resolved.slot,
    staminaCost,
    targetObject,
    terrainType,
    target,
  });
}

export function validateHarvest(state, actorId, target, { requireAdjacent = true } = {}) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  target = normalizeActorTarget(state, actor, target);
  if (target.mapId !== actor.mapId) return outcome(false, "TARGET_DIFFERENT_MAP");
  if (!isInBounds(state.world, target)) return outcome(false, "TARGET_OUT_OF_BOUNDS");
  if (requireAdjacent && !isAdjacent(getEntityLocation(actor), target)) {
    return outcome(false, "TARGET_NOT_ADJACENT");
  }

  const plant = getWorldObject(state.world, target);
  if (plant?.type !== "plant" || plant.growthStage < plant.matureStage) {
    return outcome(false, "CROP_NOT_READY");
  }
  const definition = getCropType(plant.cropType);
  const quantity = deterministicHarvestQuantity(plant, definition);
  if (!canAddItem(actor.inventory, definition.produceItemId, quantity)) {
    return outcome(false, "INVENTORY_FULL");
  }
  return outcome(true, "HARVEST_VALID", { actor, plant, target, definition, quantity });
}

function addHistory(state, event) {
  const recorded = { tick: state.tick, day: state.day, ...event };
  state.history.push(recorded);
  recordDayEvent(state, recorded);
  if (state.history.length > 200) state.history.shift();
}

export function moveStep(state, actorId, target) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  target = normalizeActorTarget(state, actor, target);
  if (target.mapId !== actor.mapId) return outcome(false, "TARGET_DIFFERENT_MAP");
  if (!isAdjacent(getEntityLocation(actor), target)) return outcome(false, "INVALID_MOVE_DISTANCE");
  if (!isWalkable(state, target, actorId)) return outcome(false, "MOVE_BLOCKED");

  const direction = CARDINAL_DIRECTIONS.find(
    ({ x, y }) => actor.position.x + x === target.x && actor.position.y + y === target.y,
  );
  const previousPosition = { ...actor.position };
  actor.position = { x: target.x, y: target.y };
  actor.facing = direction.name;
  actor.motion = {
    from: previousPosition,
    to: { x: target.x, y: target.y },
    startedTick: state.tick,
    durationTicks: GAME_CONFIG.movementCooldownTicks + 1,
  };
  const portal = getWorldEntitiesAt(state.world, target)
    .find((entity) => entity.type === "portal");
  if (portal) {
    actor.mapId = portal.destination.mapId;
    actor.position = { x: portal.destination.x, y: portal.destination.y };
    actor.facing = portal.destination.facing ?? actor.facing;
    actor.motion = null;
    addHistory(state, {
      type: "portal_travel",
      actorId,
      portalId: portal.id,
      destination: getEntityLocation(actor),
    });
  }
  actor.sleeping = false;
  addHistory(state, { type: "move", actorId, target: { ...target } });
  return outcome(true, portal ? "PORTAL_TRAVELLED" : "MOVED", {
    location: getEntityLocation(actor),
    position: { ...actor.position },
  });
}

export function useItem(state, actorId, target, selector = {}) {
  const validation = validateUseItem(state, actorId, target, selector);
  if (!validation.success) return validation;

  ({ target } = validation);
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
    if (targetObject?.type === "plant") {
      if (targetObject.growthStage === 0) {
        addItem(actor.inventory, getCropType(targetObject.cropType).seedItemId, 1);
      }
      removeWorldEntity(state.world, targetObject.id);
    } else {
      setTerrainAt(state.world, target, "tilled");
    }
  } else if (item.itemId === "watering_can") {
    setTerrainAt(state.world, target, "wet_tilled");
  } else if (getCropTypeBySeed(item.itemId)) {
    const crop = getCropTypeBySeed(item.itemId);
    addWorldEntity(state.world, createPlant({
      id: generateWorldEntityId(state.world, "plant"),
      cropType: crop.id,
      position: target,
    }));
    item.quantity -= 1;
    if (item.quantity === 0) actor.inventory[slot - 1] = null;
  } else if (getItemType(item.itemId)?.category === "placeable") {
    addWorldEntity(state.world, createRechargeStation({
      id: generateWorldEntityId(state.world, "recharge-station"),
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

export function validateRecharge(state, actorId, target, { requireAdjacent = true } = {}) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (actor.role !== "robot") return outcome(false, "ROBOT_REQUIRED");
  target = normalizeActorTarget(state, actor, target);
  if (target.mapId !== actor.mapId) return outcome(false, "TARGET_DIFFERENT_MAP");
  if (!isInBounds(state.world, target)) return outcome(false, "TARGET_OUT_OF_BOUNDS");
  if (requireAdjacent && !isAdjacent(getEntityLocation(actor), target)) {
    return outcome(false, "TARGET_NOT_ADJACENT");
  }
  const station = getWorldObject(state.world, target);
  if (station?.type !== "recharge_station") return outcome(false, "CHARGER_NOT_FOUND");
  if (actor.stamina >= GAME_CONFIG.maxStamina) return outcome(false, "ROBOT_ALREADY_CHARGED");
  if (station.charge <= 0) return outcome(false, "CHARGER_EMPTY");
  return outcome(true, "RECHARGE_VALID", { actor, station, target });
}

export function rechargeRobot(state, actorId, target) {
  const validation = validateRecharge(state, actorId, target);
  if (!validation.success) return validation;
  const { actor, station } = validation;
  const transferred = Math.min(GAME_CONFIG.maxStamina - actor.stamina, station.charge);
  actor.stamina += transferred;
  station.charge -= transferred;
  actor.sleeping = false;
  addHistory(state, {
    type: "robot_recharged",
    actorId,
    entityId: station.id,
    transferred,
    remainingCharge: station.charge,
    target: { ...validation.target },
  });
  return outcome(true, "ROBOT_RECHARGED", {
    transferred,
    stamina: actor.stamina,
    remainingCharge: station.charge,
    target: { ...validation.target },
  });
}

export function harvest(state, actorId, target) {
  const validation = validateHarvest(state, actorId, target);
  if (!validation.success) return validation;

  ({ target } = validation);
  const { actor, plant, definition, quantity } = validation;
  addItem(actor.inventory, definition.produceItemId, quantity);
  plant.harvestCount += 1;
  if (definition.regrowDays) {
    plant.growthStage = plant.matureStage - definition.regrowDays;
  } else {
    removeWorldEntity(state.world, plant.id);
  }
  addHistory(state, {
    type: "crop_harvested",
    actorId,
    entityId: plant.id,
    cropType: plant.cropType,
    quantity,
    regrows: Boolean(definition.regrowDays),
    target: { ...target },
  });
  return outcome(true, "CROP_HARVESTED", {
    cropType: plant.cropType,
    itemId: definition.produceItemId,
    quantity,
    regrows: Boolean(definition.regrowDays),
    target: { ...target },
  });
}

function advanceDay(state) {
  dispatchLifecycleEvent(state, "day_end");
  const summary = finalizeDaySummary(state);
  state.lastDaySummary = summary;
  state.day += 1;
  state.dayStats = createDayStats(state.day);
  dispatchLifecycleEvent(state, "day_begin");
  return outcome(true, "DAY_ADVANCED", { day: state.day, summary });
}

export function sleepActor(state, actorId) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (actor.activeIntent) return outcome(false, "ACTOR_BUSY", { operationId: actor.activeIntent });
  const eligibleBeds = getWorldEntitiesByType(state.world, "bed")
    .filter((bed) => bed.actorId === actorId);
  if (eligibleBeds.length === 0) return outcome(false, "BED_REQUIRED");
  if (!eligibleBeds.some((bed) => isAdjacent(getEntityLocation(actor), getEntityLocation(bed)))) {
    return outcome(false, "BED_NOT_ADJACENT");
  }
  actor.sleeping = true;
  addHistory(state, { type: "actor_slept", actorId, tick: state.tick, day: state.day });

  const actors = getWorldEntitiesByType(state.world, "actor");
  const beds = getWorldEntitiesByType(state.world, "bed");
  if (actor.role === "robot") {
    for (const candidate of actors) {
      if (candidate.role !== "human" || candidate.sleeping || candidate.activeIntent) continue;
      const candidateBed = beds.find((bed) => bed.actorId === candidate.id);
      if (!candidateBed
        || !isAdjacent(getEntityLocation(candidate), getEntityLocation(candidateBed))) continue;
      candidate.sleeping = true;
      addHistory(state, {
        type: "actor_slept",
        actorId: candidate.id,
        initiatedByActorId: actorId,
        tick: state.tick,
        day: state.day,
      });
    }
  }
  if (!actors.every((candidate) => candidate.sleeping)) {
    return outcome(true, "WAITING_FOR_OTHER_ACTORS", { actorId });
  }

  return advanceDay(state);
}

export function sleepAnyway(state, actorId) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!actor.sleeping) return outcome(false, "ACTOR_NOT_SLEEPING");
  const actors = getWorldEntitiesByType(state.world, "actor");
  const busyActor = actors.find((candidate) => candidate.activeIntent);
  if (busyActor) {
    return outcome(false, "OTHER_ACTOR_BUSY", {
      actorId: busyActor.id,
      operationId: busyActor.activeIntent,
    });
  }
  for (const candidate of actors) {
    if (candidate.sleeping) continue;
    candidate.sleeping = true;
    addHistory(state, {
      type: "actor_slept",
      actorId: candidate.id,
      initiatedByActorId: actorId,
      forced: true,
      tick: state.tick,
      day: state.day,
    });
  }
  return advanceDay(state);
}

function isActorAtMarket(state, actor) {
  return getWorldEntitiesByType(state.world, "market", actor.mapId).some(
    (market) => isAdjacent(getEntityLocation(actor), getEntityLocation(market)),
  );
}

export function buyItem(state, actorId, itemId, quantity = 1) {
  const actor = getActor(state, actorId);
  if (!actor) return outcome(false, "ACTOR_NOT_FOUND");
  if (!isActorAtMarket(state, actor)) return outcome(false, "MARKET_NOT_ADJACENT");
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
  if (!isActorAtMarket(state, actor)) return outcome(false, "MARKET_NOT_ADJACENT");
  const itemType = getItemType(itemId);
  if (!itemType?.sellPrice) return outcome(false, "ITEM_NOT_SELLABLE");
  if (!Number.isInteger(quantity) || quantity < 1) return outcome(false, "INVALID_QUANTITY");
  if (!removeItem(actor.inventory, itemId, quantity)) return outcome(false, "ITEM_NOT_FOUND");

  const totalPrice = itemType.sellPrice * quantity;
  state.money += totalPrice;
  addHistory(state, { type: "item_sold", actorId, itemId, quantity, totalPrice });
  return outcome(true, "ITEM_SOLD", { itemId, quantity, totalPrice, money: state.money });
}

function validateTransferPermission(requester, source, destination) {
  if (!source?.inventory || !destination?.inventory) return "NOT_A_CONTAINER";
  const requesterLocation = getEntityLocation(requester);
  if (!isAdjacent(requesterLocation, getEntityLocation(source) ?? requesterLocation)
    && requester.id !== source.id) return "SOURCE_NOT_ADJACENT";
  if (!isAdjacent(requesterLocation, getEntityLocation(destination) ?? requesterLocation)
    && requester.id !== destination.id) return "DESTINATION_NOT_ADJACENT";

  if (requester.role === "robot" && source.role === "human") {
    return "PLAYER_INVENTORY_PRIVATE";
  }
  const requesterIsParty = requester.id === source.id || requester.id === destination.id;
  if (!requesterIsParty) return "TRANSFER_NOT_PERMITTED";
  return null;
}

export function transferItem(
  state,
  requesterId,
  { fromEntityId, toEntityId, itemId, quantity = 1 },
) {
  const requester = getActor(state, requesterId);
  if (!requester) return outcome(false, "ACTOR_NOT_FOUND");
  if (!Number.isInteger(quantity) || quantity < 1) return outcome(false, "INVALID_QUANTITY");
  const source = getWorldEntity(state.world, fromEntityId);
  const destination = getWorldEntity(state.world, toEntityId);
  const permissionError = validateTransferPermission(requester, source, destination);
  if (permissionError) return outcome(false, permissionError);

  const available = getItemQuantity(source.inventory, itemId);
  if (available === 0) return outcome(false, "ITEM_NOT_FOUND");
  const moved = Math.min(quantity, available, getAddableQuantity(destination.inventory, itemId));
  if (moved === 0) return outcome(false, "INVENTORY_FULL", { moved: 0, remainder: quantity });

  removeItem(source.inventory, itemId, moved);
  addItem(destination.inventory, itemId, moved);
  addHistory(state, {
    type: "item_transferred",
    requesterId,
    fromEntityId,
    toEntityId,
    itemId,
    quantity: moved,
  });
  return outcome(true, "ITEM_TRANSFERRED", {
    itemId,
    requested: quantity,
    moved,
    remainder: quantity - moved,
  });
}