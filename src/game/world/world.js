import { GAME_CONFIG } from "../config.js";

export function positionKey({ x, y }) {
  return `${x},${y}`;
}

export function createWorld({
  width = GAME_CONFIG.mapWidth,
  height = GAME_CONFIG.mapHeight,
  objects = [],
} = {}) {
  return {
    width,
    height,
    terrain: Array.from({ length: height }, () => Array(width).fill("grass")),
    objects: Object.fromEntries(
      objects.map((object) => [positionKey(object), { ...object }]),
    ),
  };
}

export function isInBounds(world, position) {
  return position.x >= 0
    && position.y >= 0
    && position.x < world.width
    && position.y < world.height;
}

export function getWorldObject(world, position) {
  return world.objects[positionKey(position)] ?? null;
}