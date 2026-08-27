import { GAME_CONFIG } from "./config.js";
import { createGameState } from "./state.js";
import { createChest } from "./world/entities/containers/chests.js";
import { addWorldEntity, addWorldMap, createWorld } from "./world/world.js";

export const FARM_DEFINITION_VERSION = 9;

function decoration(id, spriteId, x, y, { blocking = true, name, type = "decoration" } = {}) {
  return {
    id,
    type,
    spriteId,
    name: name ?? id,
    blocking,
    position: { x, y },
  };
}

function interiorDecoration(id, spriteId, x, y, options) {
  return { ...decoration(id, spriteId, x, y, options), mapId: "farmhouse" };
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
      entities.push(isDoor ? {
        id: "portal-farmhouse-door",
        type: "portal",
        spriteId: houseRows[row][column],
        name: "Farmhouse door",
        blocking: false,
        position: { x: column + 2, y: row + 1 },
        destination: { mapId: "farmhouse", x: 4, y: 4, facing: "north" },
      } : decoration(
        `house-${row}-${column}`,
        houseRows[row][column],
        column + 2,
        row + 1,
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
    decoration("market-corn-crate", "entity.produce_corn", 18, 11, {
      name: "Corn crate",
      type: "market",
    }),
    decoration("market-tomato-crate", "entity.produce_tomato", 19, 11, {
      name: "Tomato crate",
      type: "market",
    }),
    decoration("market-leafy-crate", "entity.produce_leafy", 20, 11, {
      name: "Leafy produce crate",
      type: "market",
    }),
  );
  return entities;
}

function addFarmhouseInterior(world) {
  const width = 8;
  const height = 6;
  addWorldMap(world, {
    id: "farmhouse",
    width,
    height,
    terrain: Array.from({ length: height }, () => Array(width).fill("floor")),
  });

  for (let x = 0; x < width; x += 1) {
    addWorldEntity(world, interiorDecoration(
      `inside-wall-top-${x}`,
      "interior.wall_warm_masonry",
      x,
      0,
    ));
  }
  for (let y = 1; y < height; y += 1) {
    addWorldEntity(world, interiorDecoration(
      `inside-wall-left-${y}`,
      "interior.wall_warm_masonry",
      0,
      y,
    ));
    addWorldEntity(world, interiorDecoration(
      `inside-wall-right-${y}`,
      "interior.wall_warm_masonry",
      width - 1,
      y,
    ));
  }
  for (let x = 1; x < width - 1; x += 1) {
    if (x === 4) continue;
    addWorldEntity(world, interiorDecoration(
      `inside-wall-bottom-${x}`,
      "interior.wall_warm_masonry",
      x,
      height - 1,
    ));
  }

  const interiorEntities = [
    {
      id: "portal-farmhouse-exit",
      type: "portal",
      mapId: "farmhouse",
      spriteId: "interior.door_wood_a",
      name: "Farmhouse exit",
      blocking: false,
      position: { x: 4, y: 5 },
      destination: { mapId: "farm", x: 3, y: 5, facing: "south" },
    },
    {
      id: "bed-player",
      type: "bed",
      mapId: "farmhouse",
      actorId: "player",
      spriteId: "furniture.bed_cream",
      name: "Player bed",
      blocking: true,
      position: { x: 1, y: 2 },
    },
    {
      id: "bed-robot",
      type: "bed",
      mapId: "farmhouse",
      actorId: "robot",
      spriteId: "furniture.bed_orange",
      name: "Robot charging berth",
      blocking: true,
      position: { x: 5, y: 2 },
    },
  ];
  for (const entity of interiorEntities) {
    entity.mapId ??= "farmhouse";
    addWorldEntity(world, entity);
  }
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
      { id: "tree-9", type: "tree", x: 7, y: 2, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-10", type: "tree", x: 10, y: 3, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-11", type: "tree", x: 13, y: 1, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-1", type: "tree", x: 20, y: 2, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-2", type: "tree", x: 22, y: 4, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-12", type: "tree", x: 1, y: 8, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-13", type: "tree", x: 2, y: 11, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-14", type: "tree", x: 7, y: 9, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-15", type: "tree", x: 10, y: 8, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-16", type: "tree", x: 12, y: 10, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-17", type: "tree", x: 14, y: 9, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-3", type: "tree", x: 21, y: 9, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-4", type: "tree", x: 22, y: 14, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-5", type: "tree", x: 18, y: 15, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-18", type: "tree", x: 7, y: 14, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-19", type: "tree", x: 11, y: 14, hitPoints: GAME_CONFIG.treeHitPoints },
      { id: "tree-20", type: "tree", x: 16, y: 15, hitPoints: GAME_CONFIG.treeHitPoints },
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
  addFarmhouseInterior(world);
  world.definitionId = "farm";
  world.definitionVersion = FARM_DEFINITION_VERSION;

  return createGameState({
    world,
    playerPosition: { x: 5, y: 5 },
    robotPosition: { x: 6, y: 5 },
  });
}
