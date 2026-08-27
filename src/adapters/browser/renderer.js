import { GAME_CONFIG } from "../../game/config.js";

const COLORS = Object.freeze({
  grass: "#75aa4f",
  grassAlternate: "#6c9f49",
  grid: "#5c8d3d",
  treeTrunk: "#72462a",
  treeLeaves: "#285b35",
  treeHighlight: "#3f7c43",
  player: "#f4d35e",
  playerHat: "#315f91",
  robot: "#c8d0d8",
  robotPanel: "#4f718c",
  shadow: "rgba(24, 45, 29, 0.35)",
});

function drawTree(context, object, scale) {
  const left = object.x * scale;
  const top = object.y * scale;
  context.fillStyle = COLORS.treeTrunk;
  context.fillRect(left + scale * 0.42, top + scale * 0.52, scale * 0.2, scale * 0.42);
  context.fillStyle = COLORS.treeLeaves;
  context.fillRect(left + scale * 0.12, top + scale * 0.14, scale * 0.76, scale * 0.58);
  context.fillStyle = COLORS.treeHighlight;
  context.fillRect(left + scale * 0.22, top + scale * 0.2, scale * 0.28, scale * 0.16);
}

function drawActor(context, actor, scale) {
  const left = actor.position.x * scale;
  const top = actor.position.y * scale;
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

export function renderGame(context, state) {
  const scale = GAME_CONFIG.tileSize * 3;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);

  for (let y = 0; y < state.world.height; y += 1) {
    for (let x = 0; x < state.world.width; x += 1) {
      context.fillStyle = (x + y) % 2 === 0 ? COLORS.grass : COLORS.grassAlternate;
      context.fillRect(x * scale, y * scale, scale, scale);
      context.strokeStyle = COLORS.grid;
      context.strokeRect(x * scale, y * scale, scale, scale);
    }
  }

  for (const object of Object.values(state.world.objects)) {
    if (object.type === "tree") drawTree(context, object, scale);
  }

  drawActor(context, state.actors.player, scale);
  drawActor(context, state.actors.robot, scale);
}