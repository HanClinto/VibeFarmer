export const GAME_CONFIG = Object.freeze({
  tileSize: 16,
  mapWidth: 12,
  mapHeight: 10,
  inventorySlots: 10,
  maxStackSize: 99,
  maxStamina: 20,
  treeHitPoints: 3,
  maxRobotPlanLength: 24,
  staminaCosts: Object.freeze({
    axe: 2,
    hoe: 1,
  }),
});

export const CARDINAL_DIRECTIONS = Object.freeze([
  Object.freeze({ name: "north", x: 0, y: -1 }),
  Object.freeze({ name: "east", x: 1, y: 0 }),
  Object.freeze({ name: "south", x: 0, y: 1 }),
  Object.freeze({ name: "west", x: -1, y: 0 }),
]);