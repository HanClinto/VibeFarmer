import { GAME_CONFIG } from "./config.js";
import { createWorld } from "./world/world.js";

function emptyInventory() {
  return Array.from({ length: GAME_CONFIG.inventorySlots }, () => null);
}

function createActor(id, position, sleeping) {
  const inventory = emptyInventory();
  inventory[0] = { itemId: "axe", quantity: 1 };
  inventory[1] = { itemId: "hoe", quantity: 1 };

  return {
    id,
    role: id === "robot" ? "robot" : "human",
    position: { ...position },
    facing: "south",
    stamina: GAME_CONFIG.maxStamina,
    sleeping,
    selectedSlot: 1,
    inventory,
  };
}

export function createGameState({ world = createWorld() } = {}) {
  return {
    version: 1,
    day: 1,
    money: 100,
    world,
    actors: {
      player: createActor("player", { x: 1, y: 1 }, false),
      robot: createActor("robot", { x: 2, y: 1 }, true),
    },
    history: [],
  };
}