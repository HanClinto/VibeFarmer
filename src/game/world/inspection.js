import { GAME_CONFIG } from "../config.js";
import { getTerrainAt, TERRAIN_TYPES } from "./terrain/terrain.js";
import { getEntityLocation, getWorldEntity, isInBounds, normalizeLocation } from "./world.js";

function isAdjacent(first, second) {
  return first.mapId === second.mapId
    && Math.abs(first.x - second.x) + Math.abs(first.y - second.y) === 1;
}

function copyInventory(inventory) {
  return inventory.map((stack) => (stack ? { ...stack } : null));
}

function canInspectInventory(viewer, entity) {
  if (!entity.inventory) return false;
  if (viewer.id === entity.id) return true;
  if (!isAdjacent(getEntityLocation(viewer), getEntityLocation(entity))) return false;
  if (entity.type === "chest") return true;
  return viewer.role === "human" && entity.role === "robot";
}

function inspectEntity(viewer, entity, terrainType) {
  const base = {
    id: entity.id,
    type: entity.type,
    mapId: entity.mapId,
    position: { ...entity.position },
  };
  if (entity.type === "tree") {
    return {
      ...base,
      name: "Tree",
      hitPoints: entity.hitPoints,
      maxHitPoints: GAME_CONFIG.treeHitPoints,
      blocking: true,
    };
  }
  if (entity.type === "plant") {
    return {
      ...base,
      name: entity.cropType === "turnip" ? "Turnip" : entity.cropType,
      cropType: entity.cropType,
      growthStage: entity.growthStage,
      matureStage: entity.matureStage,
      watered: terrainType === "wet_tilled",
      harvestReady: entity.growthStage >= entity.matureStage,
    };
  }
  if (entity.type === "chest") {
    return {
      ...base,
      name: "Farm Chest",
      capacity: entity.inventory.length,
      usedSlots: entity.inventory.filter(Boolean).length,
      ...(canInspectInventory(viewer, entity)
        ? { inventory: copyInventory(entity.inventory) }
        : {}),
    };
  }
  if (entity.type === "actor") {
    return {
      ...base,
      name: entity.role === "robot" ? "Robot Farmhand" : "Player",
      role: entity.role,
      facing: entity.facing,
      stamina: entity.stamina,
      maxStamina: GAME_CONFIG.maxStamina,
      sleeping: entity.sleeping,
      activeIntent: entity.activeIntent,
      selectedSlot: entity.selectedSlot,
      ...(canInspectInventory(viewer, entity)
        ? { inventory: copyInventory(entity.inventory) }
        : {}),
    };
  }
  if (entity.type === "market") {
    return {
      ...base,
      name: entity.name ?? "Farm Market",
      canTrade: isAdjacent(getEntityLocation(viewer), getEntityLocation(entity)),
    };
  }
  if (entity.type === "bed") {
    return {
      ...base,
      name: entity.name ?? "Bed",
      actorId: entity.actorId,
      canSleep: entity.actorId === viewer.id
        && isAdjacent(getEntityLocation(viewer), getEntityLocation(entity)),
    };
  }
  return { ...base, name: entity.name ?? entity.type };
}

export function inspectLocation(state, viewerId, target) {
  const viewer = getWorldEntity(state.world, viewerId);
  if (viewer?.type !== "actor") {
    return { success: false, code: "VIEWER_NOT_FOUND" };
  }
  target = normalizeLocation(state.world, target, viewer.mapId);
  if (!isInBounds(state.world, target)) {
    return { success: false, code: "TARGET_OUT_OF_BOUNDS" };
  }

  const terrainType = getTerrainAt(state.world, target);
  const entities = Object.values(state.world.entities)
    .filter((entity) => entity.mapId === target.mapId
      && entity.position?.x === target.x
      && entity.position?.y === target.y)
    .sort((first, second) => first.id.localeCompare(second.id))
    .map((entity) => inspectEntity(viewer, entity, terrainType));
  return {
    success: true,
    code: "LOCATION_INSPECTED",
    target: { ...target },
    terrain: {
      type: terrainType,
      tillable: TERRAIN_TYPES[terrainType].tillable,
      passable: TERRAIN_TYPES[terrainType].passable,
      watered: terrainType === "wet_tilled",
    },
    entities,
  };
}