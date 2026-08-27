import { GAME_CONFIG } from "../../game/config.js";
import { getWorldMap } from "../../game/world/world.js";
import { computeCamera } from "./camera.js";

export const RENDER_TILE_SIZE = GAME_CONFIG.tileSize * 3;

const COLORS = Object.freeze({
  grass: "#75aa4f",
  grassAlternate: "#6c9f49",
  tilled: "#8f5b3b",
  wetTilled: "#5f463a",
  grid: "#5c8d3d",
  treeTrunk: "#72462a",
  treeLeaves: "#285b35",
  treeHighlight: "#3f7c43",
  player: "#f4d35e",
  playerHat: "#315f91",
  robot: "#c8d0d8",
  robotPanel: "#4f718c",
  shadow: "rgba(24, 45, 29, 0.35)",
  mapBackdrop: "#2b252d",
  cropStem: "#244f2c",
  cropLeaf: "#53a447",
  cropRoot: "#ddd071",
  chestWood: "#a56a34",
  chestBand: "#4e3b2f",
});

function terrainColor(terrainType, alternate) {
  if (terrainType === "tilled") return COLORS.tilled;
  if (terrainType === "wet_tilled") return COLORS.wetTilled;
  return alternate ? COLORS.grassAlternate : COLORS.grass;
}

function drawSprite(context, sprites, frameId, left, top, scale) {
  const frame = sprites?.frames[frameId];
  if (!frame) return false;
  context.drawImage(frame.image, left, top, scale, scale);
  return true;
}

function drawTree(context, object, scale, sprites) {
  const left = object.position.x * scale;
  const top = object.position.y * scale;
  const frameId = object.hitPoints < GAME_CONFIG.treeHitPoints
    ? "entity.tree_small"
    : "entity.tree";
  if (drawSprite(context, sprites, frameId, left, top, scale)) return;
  context.fillStyle = COLORS.treeTrunk;
  context.fillRect(left + scale * 0.42, top + scale * 0.52, scale * 0.2, scale * 0.42);
  context.fillStyle = COLORS.treeLeaves;
  context.fillRect(left + scale * 0.12, top + scale * 0.14, scale * 0.76, scale * 0.58);
  context.fillStyle = COLORS.treeHighlight;
  context.fillRect(left + scale * 0.22, top + scale * 0.2, scale * 0.28, scale * 0.16);
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function getActorRenderPosition(actor, simulationTick, tickProgress) {
  const motion = actor.motion;
  if (!motion) return actor.position;

  const elapsedTicks = (simulationTick - motion.startedTick) + tickProgress;
  const progress = clamp(elapsedTicks / motion.durationTicks, 0, 1);
  return {
    x: motion.from.x + ((motion.to.x - motion.from.x) * progress),
    y: motion.from.y + ((motion.to.y - motion.from.y) * progress),
  };
}

function drawActor(context, actor, scale, simulationTick, tickProgress, sprites) {
  const position = getActorRenderPosition(actor, simulationTick, tickProgress);
  const left = position.x * scale;
  const top = position.y * scale;
  context.fillStyle = COLORS.shadow;
  context.fillRect(left + scale * 0.2, top + scale * 0.76, scale * 0.62, scale * 0.14);

  if (actor.role === "robot") {
    if (drawSprite(context, sprites, "actor.robot.south", left, top, scale)) return;
    context.fillStyle = COLORS.robot;
    context.fillRect(left + scale * 0.24, top + scale * 0.18, scale * 0.54, scale * 0.64);
    context.fillStyle = COLORS.robotPanel;
    context.fillRect(left + scale * 0.34, top + scale * 0.38, scale * 0.34, scale * 0.2);
    return;
  }

  if (drawSprite(context, sprites, "actor.farmhand_b.south", left, top, scale)) return;

  context.fillStyle = COLORS.player;
  context.fillRect(left + scale * 0.28, top + scale * 0.26, scale * 0.48, scale * 0.58);
  context.fillStyle = COLORS.playerHat;
  context.fillRect(left + scale * 0.18, top + scale * 0.14, scale * 0.68, scale * 0.2);
}

function drawPlant(context, plant, scale, sprites) {
  const left = plant.position.x * scale;
  const top = plant.position.y * scale;
  const stage = plant.growthStage;
  if (drawSprite(
    context,
    sprites,
    `crop.turnip.${Math.min(stage, plant.matureStage)}`,
    left,
    top,
    scale,
  )) return;
  context.fillStyle = COLORS.cropStem;
  context.fillRect(left + scale * 0.46, top + scale * 0.44, scale * 0.12, scale * 0.4);
  context.fillStyle = COLORS.cropLeaf;
  context.fillRect(left + scale * 0.26, top + scale * (0.58 - (stage * 0.08)), scale * 0.28, scale * 0.16);
  context.fillRect(left + scale * 0.52, top + scale * (0.48 - (stage * 0.06)), scale * 0.24, scale * 0.16);
  if (stage >= plant.matureStage) {
    context.fillStyle = COLORS.cropRoot;
    context.fillRect(left + scale * 0.38, top + scale * 0.7, scale * 0.3, scale * 0.2);
  }
}

export function chestFrameId(isOpen) {
  return isOpen ? "entity.chest.open" : "entity.chest.closed";
}

export function operationPreview(state, actorId) {
  const actor = state.world.entities[actorId];
  const operation = actor?.activeIntent ? state.operations[actor.activeIntent] : null;
  if (!operation) return null;
  return {
    mapId: actor.mapId,
    path: operation.path.filter((step) => step.mapId === actor.mapId),
    destination: operation.command.target?.mapId === actor.mapId
      ? operation.command.target
      : null,
  };
}

function drawTileFeedback(context, scale, preview, hoverTarget, currentMapId) {
  if (preview) {
    context.fillStyle = "rgba(255, 244, 207, 0.62)";
    for (const step of preview.path) {
      context.fillRect(
        (step.x * scale) + (scale * 0.42),
        (step.y * scale) + (scale * 0.42),
        scale * 0.16,
        scale * 0.16,
      );
    }
    if (preview.destination) {
      context.strokeStyle = "#f4d35e";
      context.lineWidth = 3;
      context.strokeRect(
        (preview.destination.x * scale) + 4,
        (preview.destination.y * scale) + 4,
        scale - 8,
        scale - 8,
      );
    }
  }
  if (hoverTarget?.mapId === currentMapId) {
    context.strokeStyle = "rgba(255, 255, 255, 0.9)";
    context.lineWidth = 2;
    context.strokeRect(
      (hoverTarget.x * scale) + 2,
      (hoverTarget.y * scale) + 2,
      scale - 4,
      scale - 4,
    );
  }
}

export function terrainFrameId(world, x, y) {
  const terrainType = world.terrain[y][x];
  if (terrainType === "floor") return "interior.floor_wood";
  if (terrainType === "path") return "terrain.path";
  if (terrainType !== "water") {
    if (terrainType === "grass") return (x + y) % 5 === 0
      ? "terrain.grass_tufts"
      : "terrain.grass";
    return `terrain.${terrainType}`;
  }

  const waterAt = (nextX, nextY) => world.terrain[nextY]?.[nextX] === "water";
  const north = waterAt(x, y - 1);
  const south = waterAt(x, y + 1);
  const west = waterAt(x - 1, y);
  const east = waterAt(x + 1, y);
  if (!north && !west) return "terrain.water.top_left";
  if (!north && !east) return "terrain.water.top_right";
  if (!south && !west) return "terrain.water.bottom_left";
  if (!south && !east) return "terrain.water.bottom_right";
  if (!north) return "terrain.water.top";
  if (!south) return "terrain.water.bottom";
  if (!west) return "terrain.water.left";
  if (!east) return "terrain.water.right";
  return "terrain.water.center";
}

function drawChest(context, chest, scale, sprites, isOpen) {
  const left = chest.position.x * scale;
  const top = chest.position.y * scale;
  const frameId = chestFrameId(isOpen);
  if (drawSprite(context, sprites, frameId, left, top, scale)) return;
  context.fillStyle = COLORS.chestWood;
  context.fillRect(left + scale * 0.16, top + scale * 0.3, scale * 0.72, scale * 0.54);
  context.fillStyle = COLORS.chestBand;
  context.fillRect(left + scale * 0.16, top + scale * 0.44, scale * 0.72, scale * 0.12);
  context.fillRect(left + scale * 0.45, top + scale * 0.5, scale * 0.12, scale * 0.18);
}

export function renderGame(
  context,
  state,
  {
    tickProgress = 1,
    sprites = null,
    openEntityIds = new Set(),
    hoverTarget = null,
  } = {},
) {
  const scale = RENDER_TILE_SIZE;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = COLORS.mapBackdrop;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  const playerPosition = getActorRenderPosition(
    state.world.entities.player,
    state.tick,
    tickProgress,
  );
  const currentMapId = state.world.entities.player.mapId;
  const currentMap = getWorldMap(state.world, currentMapId);
  const camera = computeCamera({
    focus: playerPosition,
    worldWidth: currentMap.width,
    worldHeight: currentMap.height,
    viewportWidth: context.canvas.width,
    viewportHeight: context.canvas.height,
    tileSize: scale,
  });
  context.save();
  context.translate(-camera.x, -camera.y);

  for (let y = 0; y < currentMap.height; y += 1) {
    for (let x = 0; x < currentMap.width; x += 1) {
      const terrainType = currentMap.terrain[y][x];
      const frameId = terrainFrameId(currentMap, x, y);
      if (!drawSprite(context, sprites, frameId, x * scale, y * scale, scale)) {
        context.fillStyle = terrainColor(terrainType, (x + y) % 2 !== 0);
        context.fillRect(x * scale, y * scale, scale, scale);
        context.strokeStyle = COLORS.grid;
        context.strokeRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  for (const object of Object.values(state.world.entities)) {
    if (object.mapId !== currentMapId) continue;
    if (object.type === "tree") drawTree(context, object, scale, sprites);
    else if (object.type === "plant") drawPlant(context, object, scale, sprites);
    else if (object.type === "chest") {
      drawChest(context, object, scale, sprites, openEntityIds.has(object.id));
    }
    else if (object.spriteId) {
      drawSprite(
        context,
        sprites,
        object.spriteId,
        object.position.x * scale,
        object.position.y * scale,
        scale,
      );
    }
  }

  drawActor(context, state.world.entities.player, scale, state.tick, tickProgress, sprites);
  if (state.world.entities.robot.mapId === currentMapId) {
    drawActor(context, state.world.entities.robot, scale, state.tick, tickProgress, sprites);
  }
  drawTileFeedback(
    context,
    scale,
    operationPreview(state, "player"),
    hoverTarget,
    currentMapId,
  );
  context.restore();
  return camera;
}