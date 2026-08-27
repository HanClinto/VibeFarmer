import { GAME_CONFIG } from "./config.js";
import { createDayStats } from "./day-summary.js";
import { addWorldEntity, createWorld } from "./world/world.js";

function emptyInventory() {
  return Array.from({ length: GAME_CONFIG.inventorySlots }, () => null);
}

function createActor(id, position, sleeping) {
  const inventory = emptyInventory();
  inventory[0] = { itemId: "axe", quantity: 1 };
  inventory[1] = { itemId: "hoe", quantity: 1 };
  inventory[2] = { itemId: "watering_can", quantity: 1 };
  inventory[3] = { itemId: "turnip_seeds", quantity: 6 };

  return {
    id,
    type: "actor",
    role: id === "robot" ? "robot" : "human",
    position: { ...position },
    facing: "south",
    stamina: GAME_CONFIG.maxStamina,
    sleeping,
    selectedSlot: 1,
    inventory,
    activeIntent: null,
    motion: null,
  };
}

export function createGameState({
  world = createWorld(),
  playerPosition = { x: 1, y: 1 },
  robotPosition = { x: 2, y: 1 },
} = {}) {
  addWorldEntity(world, createActor("player", playerPosition, false));
  addWorldEntity(world, createActor("robot", robotPosition, true));

  return {
    version: 3,
    tick: 0,
    day: 1,
    money: 100,
    nextOperationId: 1,
    operations: {},
    world,
    history: [],
    dayStats: createDayStats(1),
    lastDaySummary: null,
  };
}