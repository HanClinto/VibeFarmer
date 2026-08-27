import { GAME_CONFIG } from "../config.js";

export function positionKey({ x, y }) {
  return `${x},${y}`;
}

export function createWorld({
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
      position: position ?? { x, y },
    });
  }

  return {
    width,
    height,
    nextEntityId: 1,
    terrain: Array.from({ length: height }, () => Array(width).fill("grass")),
    entities: Object.fromEntries(allEntities.map((entity) => [entity.id, { ...entity }])),
  };
}

export function isInBounds(world, position) {
  return position.x >= 0
    && position.y >= 0
    && position.x < world.width
    && position.y < world.height;
}

export function getWorldObject(world, position) {
  return Object.values(world.entities).find(
    (entity) => entity.type !== "actor"
      && entity.position?.x === position.x
      && entity.position?.y === position.y,
  ) ?? null;
}

export function getBlockingWorldObject(world, position) {
  return Object.values(world.entities).find(
    (entity) => ["tree", "rock", "debris", "chest"].includes(entity.type)
      && entity.position?.x === position.x
      && entity.position?.y === position.y,
  ) ?? null;
}

export function addWorldEntity(world, entity) {
  if (!entity.id) throw new TypeError("World entities require an id");
  if (world.entities[entity.id]) throw new Error(`Duplicate entity id: ${entity.id}`);
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

export function getWorldEntitiesByType(world, type) {
  return Object.values(world.entities).filter((entity) => entity.type === type);
}

export function generateWorldEntityId(world, prefix) {
  let id;
  do {
    id = `${prefix}-${world.nextEntityId}`;
    world.nextEntityId += 1;
  } while (world.entities[id]);
  return id;
}