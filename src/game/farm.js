import { GAME_CONFIG } from "./config.js";
import { createGameState } from "./state.js";
import { createChest } from "./world/entities/containers/chests.js";
import { createWorld } from "./world/world.js";

export function createFarmState() {
  return createGameState({
    world: createWorld({
      entities: [createChest({ id: "chest-1", position: { x: 0, y: 1 } })],
      objects: [
        { id: "tree-1", type: "tree", x: 8, y: 2, hitPoints: GAME_CONFIG.treeHitPoints },
        { id: "tree-2", type: "tree", x: 9, y: 3, hitPoints: GAME_CONFIG.treeHitPoints },
        { id: "tree-3", type: "tree", x: 8, y: 6, hitPoints: GAME_CONFIG.treeHitPoints },
        { id: "tree-4", type: "tree", x: 10, y: 7, hitPoints: GAME_CONFIG.treeHitPoints },
      ],
    }),
  });
}