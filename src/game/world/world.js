import { GAME_CONFIG } from "../config.js";

export function positionKey({ mapId, x, y }) {
  return mapId ? `${mapId}:${x},${y}` : `${x},${y}`;
}

export function createWorld({
  mapId = "farm",
  width = GAME_CONFIG.mapWidth,
  height = GAME_CONFIG.mapHeight,
  objects = [],
  entities = [],
} = {}) {
  const allEntities = [...entities];
  const typeCounts = {};
  for (const object of objects) {
    typeCounts[object.type] = (typeCounts[object.type] ?? 0) + 1;
    const { id, x, y, position, ...properties } = object;
    allEntities.push({
      ...properties,
      id: id ?? `${object.type}-${typeCounts[object.type]}`,
      mapId: properties.mapId ?? mapId,
      position: position ?? { x, y },
    });
  }

  const terrain = Array.from({ length: height }, () => Array(width).fill("grass"));
  const map = { id: mapId, width, height, terrain };

  return {
    definitionVersion: 1,
    defaultMapId: mapId,
    maps: { [mapId]: map },
    width,
    height,
    nextEntityId: 1,
    terrain,
    entities: Object.fromEntries(allEntities.map((entity) => [entity.id, {
      mapId,
      ...entity,
    }])),
  };
}

export function getWorldMap(world, mapId = world.defaultMapId) {
  return world.maps?.[mapId] ?? null;
}

export function addWorldMap(world, map) {
  if (!map?.id) throw new TypeError("World maps require an id");
  if (world.maps[map.id]) throw new Error(`Duplicate map id: ${map.id}`);
  world.maps[map.id] = map;
  return map;
}

export function getEntityLocation(entity) {
  return entity?.position ? { mapId: entity.mapId, ...entity.position } : null;
}

export function normalizeLocation(world, location, defaultMapId = world.defaultMapId) {
  return { mapId: location.mapId ?? defaultMapId, x: location.x, y: location.y };
}

export function isInBounds(world, position) {
  const map = getWorldMap(world, position.mapId);
  if (!map) return false;
  return position.x >= 0
    && position.y >= 0
    && position.x < map.width
    && position.y < map.height;
}

export function getWorldObject(world, position) {
  const mapId = position.mapId ?? world.defaultMapId;
  return Object.values(world.entities).find(
    (entity) => entity.type !== "actor"
      && entity.mapId === mapId
      && entity.position?.x === position.x
      && entity.position?.y === position.y,
  ) ?? null;
}

export function getWorldEntitiesAt(world, position) {
  const mapId = position.mapId ?? world.defaultMapId;
  return Object.values(world.entities).filter(
    (entity) => entity.mapId === mapId
      && entity.position?.x === position.x
      && entity.position?.y === position.y,
  );
}

export function getBlockingWorldObject(world, position) {
  const mapId = position.mapId ?? world.defaultMapId;
  return Object.values(world.entities).find(
    (entity) => (entity.blocking || ["tree", "rock", "debris", "chest"].includes(entity.type))
      && entity.mapId === mapId
      && entity.position?.x === position.x
      && entity.position?.y === position.y,
  ) ?? null;
}

export function addWorldEntity(world, entity) {
  if (!entity.id) throw new TypeError("World entities require an id");
  if (world.entities[entity.id]) throw new Error(`Duplicate entity id: ${entity.id}`);
  if (entity.position && !entity.mapId) entity.mapId = world.defaultMapId;
  world.entities[entity.id] = entity;
  return entity;
}

export function removeWorldEntity(world, entityId) {
  if (!world.entities[entityId]) return false;
  delete world.entities[entityId];
  return true;
}

export function getWorldEntity(world, entityId) {
  return world.entities[entityId] ?? null;
}

export function getWorldEntitiesByType(world, type, mapId) {
  return Object.values(world.entities).filter(
    (entity) => entity.type === type && (mapId === undefined || entity.mapId === mapId),
  );
}

export function generateWorldEntityId(world, prefix) {
  let id;
  do {
    id = `${prefix}-${world.nextEntityId}`;
    world.nextEntityId += 1;
  } while (world.entities[id]);
  return id;
}