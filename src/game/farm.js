import { GAME_CONFIG } from "./config.js";
import { createGameState } from "./state.js";
import { createChest } from "./world/entities/containers/chests.js";
import { createWorld } from "./world/world.js";

function decoration(id, spriteId, x, y, { blocking = true, name } = {}) {
  return {
    id,
    type: "decoration",
    spriteId,
    name: name ?? id,
    blocking,
    position: { x, y },
  };
}

function paintRectangle(world, terrainType, left, top, width, height) {
  for (let y = top; y < top + height; y += 1) {
    for (let x = left; x < left + width; x += 1) {
      world.terrain[y][x] = terrainType;
    }
  }
}

function canonicalDecorations() {
  const entities = [];
  const houseRows = [
    ["building.roof.left", "building.roof.middle", "building.roof.right"],
    ["building.roof_lower.left", "building.roof_lower.middle", "building.roof_lower.right"],
    ["building.wall.left", "building.window", "building.wall.right"],
    ["building.wall.left", "building.door", "building.wall.right"],
  ];
  for (let row = 0; row < houseRows.length; row += 1) {
    for (let column = 0; column < houseRows[row].length; column += 1) {
      const isDoor = row === 3 && column === 1;
      entities.push(decoration(
        `house-${row}-${column}`,
        houseRows[row][column],
        column + 2,
        row + 1,
        { name: isDoor ? "Farmhouse door" : "Farmhouse" },
      ));
    }
  }
  for (let x = 7; x <= 13; x += 1) {
    const edge = x === 7 ? "left" : x === 13 ? "right" : "middle";
    entities.push(decoration(`field-fence-${x}`, `building.fence.${edge}`, x, 7, {
      name: "Field fence",
    }));
  }
  entities.push(
    decoration("market-sign", "building.sign", 18, 11, { name: "Farm market" }),
    decoration("market-crate-a", "entity.crate_a", 19, 11, { name: "Produce crate" }),
    decoration("market-crate-b", "entity.crate_b", 20, 11, { name: "Produce crate" }),
  );
  return entities;
}

export function createFarmState() {
  const world = createWorld({
    width: 24,
    height: 18,
    entities: [
      createChest({ id: "chest-1", position: { x: 4, y: 5 } }),
      ...canonicalDecorations(),
    ],
    objects: [
      { id: "tree-1", type: "tree", x: 20, y: 2, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-2", type: "tree", x: 22, y: 4, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-3", type: "tree", x: 21, y: 9, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-4", type: "tree", x: 22, y: 14, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-5", type: "tree", x: 18, y: 15, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-6", type: "tree", x: 14, y: 16, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-7", type: "tree", x: 10, y: 16, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-8", type: "tree", x: 1, y: 15, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "rock-1", type: "rock", x: 14, y: 3, spriteId: "entity.rock" },
      { id: "rock-2", type: "rock", x: 15, y: 13, spriteId: "entity.rock" },
      { id: "rock-3", type: "rock", x: 20, y: 14, spriteId: "entity.rock" },
    ],
  });

  paintRectangle(world, "water", 16, 3, 5, 4);
  paintRectangle(world, "path", 4, 4, 1, 11);
  paintRectangle(world, "path", 4, 6, 12, 1);
  paintRectangle(world, "path", 4, 12, 15, 1);

  return createGameState({
    world,
    playerPosition: { x: 5, y: 5 },
    robotPosition: { x: 6, y: 5 },
  });
}