export const TERRAIN_TYPES = Object.freeze({
  grass: Object.freeze({ id: "grass", tillable: true, passable: true }),
  tilled: Object.freeze({ id: "tilled", tillable: false, passable: true }),
  wet_tilled: Object.freeze({ id: "wet_tilled", tillable: false, passable: true }),
  path: Object.freeze({ id: "path", tillable: false, passable: true }),
  water: Object.freeze({ id: "water", tillable: false, passable: false }),
});

export function getTerrainAt(world, position) {
  return world.terrain[position.y]?.[position.x] ?? null;
}

export function setTerrainAt(world, position, terrainType) {
  if (!TERRAIN_TYPES[terrainType]) throw new RangeError(`Unknown terrain type: ${terrainType}`);
  if (!world.terrain[position.y]?.[position.x]) return false;
  world.terrain[position.y][position.x] = terrainType;
  return true;
}

export function isWateredTerrain(terrainType) {
  return terrainType === "wet_tilled";
}