import { GAME_CONFIG } from "./config.js";
import { addWorldEntity, createWorld } from "./world/world.js";

function emptyInventory() {
  return Array.from({ length: GAME_CONFIG.inventorySlots }, () => null);
}

function createActor(id, position, sleeping) {
  const inventory = emptyInventory();
  inventory[0] = { itemId: "axe", quantity: 1 };
  inventory[1] = { itemId: "hoe", quantity: 1 };

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

export function createGameState({ world = createWorld() } = {}) {
  addWorldEntity(world, createActor("player", { x: 1, y: 1 }, false));
  addWorldEntity(world, createActor("robot", { x: 2, y: 1 }, true));

  return {
    version: 2,
    tick: 0,
    day: 1,
    money: 100,
    nextOperationId: 1,
    operations: {},
    world,
    history: [],
  };
}