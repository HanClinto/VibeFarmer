import { GAME_CONFIG } from "../../game/config.js";

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
  cropStem: "#244f2c",
  cropLeaf: "#53a447",
  cropRoot: "#ddd071",
});

function terrainColor(terrainType, alternate) {
  if (terrainType === "tilled") return COLORS.tilled;
  if (terrainType === "wet_tilled") return COLORS.wetTilled;
  return alternate ? COLORS.grassAlternate : COLORS.grass;
}

function drawTree(context, object, scale) {
  const left = object.position.x * scale;
  const top = object.position.y * scale;
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

function drawActor(context, actor, scale, simulationTick, tickProgress) {
  const position = getActorRenderPosition(actor, simulationTick, tickProgress);
  const left = position.x * scale;
  const top = position.y * scale;
  context.fillStyle = COLORS.shadow;
  context.fillRect(left + scale * 0.2, top + scale * 0.76, scale * 0.62, scale * 0.14);

  if (actor.role === "robot") {
    context.fillStyle = COLORS.robot;
    context.fillRect(left + scale * 0.24, top + scale * 0.18, scale * 0.54, scale * 0.64);
    context.fillStyle = COLORS.robotPanel;
    context.fillRect(left + scale * 0.34, top + scale * 0.38, scale * 0.34, scale * 0.2);
    return;
  }

  context.fillStyle = COLORS.player;
  context.fillRect(left + scale * 0.28, top + scale * 0.26, scale * 0.48, scale * 0.58);
  context.fillStyle = COLORS.playerHat;
  context.fillRect(left + scale * 0.18, top + scale * 0.14, scale * 0.68, scale * 0.2);
}

function drawPlant(context, plant, scale) {
  const left = plant.position.x * scale;
  const top = plant.position.y * scale;
  const stage = plant.growthStage;
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

export function renderGame(context, state, { tickProgress = 1 } = {}) {
  const scale = GAME_CONFIG.tileSize * 3;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (let y = 0; y < state.world.height; y += 1) {
    for (let x = 0; x < state.world.width; x += 1) {
      context.fillStyle = terrainColor(state.world.terrain[y][x], (x + y) % 2 !== 0);
      context.fillRect(x * scale, y * scale, scale, scale);
      context.strokeStyle = COLORS.grid;
      context.strokeRect(x * scale, y * scale, scale, scale);
    }
  }

  for (const object of Object.values(state.world.entities)) {
    if (object.type === "tree") drawTree(context, object, scale);
    else if (object.type === "plant") drawPlant(context, object, scale);
  }

  drawActor(context, state.world.entities.player, scale, state.tick, tickProgress);
  drawActor(context, state.world.entities.robot, scale, state.tick, tickProgress);
}