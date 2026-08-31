import { GAME_CONFIG } from "../../game/config.js";
import { getCropType } from "../../game/world/entities/plants/crop-types.js";
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

export function treeHitAnimation(age) {
  const boundedAge = clamp(age, 0, 1);
  return {
    offsetX: Math.round(Math.sin(boundedAge * Math.PI * 6) * (1 - boundedAge) * 4) || 0,
    leafProgress: boundedAge,
  };
}

function drawTree(context, object, scale, sprites, impact) {
  const animation = impact ? treeHitAnimation(impact.age) : { offsetX: 0 };
  const left = (object.position.x * scale) + animation.offsetX;
  const top = object.position.y * scale;
  if (drawSprite(context, sprites, "entity.tree", left, top, scale)) return;
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

export function actorHeldItemView(actor, actionTarget = null) {
  if (actor.sleeping || actor.activeIntent) return null;
  const selected = actor.inventory[actor.selectedSlot - 1];
  if (!selected) return null;
  let facing = actor.facing;
  if (actionTarget?.mapId === actor.mapId) {
    const deltaX = actionTarget.x - actor.position.x;
    const deltaY = actionTarget.y - actor.position.y;
    if (Math.abs(deltaX) + Math.abs(deltaY) === 1) {
      facing = deltaX < 0 ? "west" : deltaX > 0 ? "east" : deltaY < 0 ? "north" : "south";
    }
  }
  return {
    itemId: selected.itemId,
    facing,
    frameId: actor.role === "robot" ? "actor.robot.raised" : "actor.farmhand_b.raised",
  };
}

function drawActor(context, actor, scale, simulationTick, tickProgress, sprites, heldItemView) {
  const position = getActorRenderPosition(actor, simulationTick, tickProgress);
  const left = position.x * scale;
  const top = position.y * scale;
  context.fillStyle = COLORS.shadow;
  context.fillRect(left + scale * 0.2, top + scale * 0.76, scale * 0.62, scale * 0.14);

  if (actor.role === "robot") {
    if (drawSprite(
      context,
      sprites,
      heldItemView?.frameId ?? "actor.robot.south",
      left,
      top,
      scale,
    )) return;
    context.fillStyle = COLORS.robot;
    context.fillRect(left + scale * 0.24, top + scale * 0.18, scale * 0.54, scale * 0.64);
    context.fillStyle = COLORS.robotPanel;
    context.fillRect(left + scale * 0.34, top + scale * 0.38, scale * 0.34, scale * 0.2);
    return;
  }

  if (drawSprite(
    context,
    sprites,
    heldItemView?.frameId ?? "actor.farmhand_b.south",
    left,
    top,
    scale,
  )) return;

  context.fillStyle = COLORS.player;
  context.fillRect(left + scale * 0.28, top + scale * 0.26, scale * 0.48, scale * 0.58);
  context.fillStyle = COLORS.playerHat;
  context.fillRect(left + scale * 0.18, top + scale * 0.14, scale * 0.68, scale * 0.2);
}

export function heldItemRenderLayout(position, facing, scale) {
  const offsets = {
    north: { x: 0, y: -Math.round(scale * 0.1) },
    east: { x: Math.round(scale * 0.12), y: 0 },
    south: { x: 0, y: Math.round(scale * 0.1) },
    west: { x: -Math.round(scale * 0.12), y: 0 },
  };
  const offset = offsets[facing] ?? offsets.south;
  return {
    left: (position.x * scale) + offset.x,
    top: (position.y * scale) - Math.round(scale * 0.68) + offset.y,
    size: scale,
  };
}

function drawHeldItem(context, actor, heldItemView, scale, simulationTick, tickProgress, sprites) {
  if (!heldItemView) return;
  const position = getActorRenderPosition(actor, simulationTick, tickProgress);
  const layout = heldItemRenderLayout(position, heldItemView.facing, scale);
  drawSprite(
    context,
    sprites,
    `item.${heldItemView.itemId}`,
    layout.left,
    layout.top,
    layout.size,
  );
}

function drawActorWithHeldItem(
  context,
  actor,
  scale,
  simulationTick,
  tickProgress,
  sprites,
  actionTarget,
) {
  const heldItemView = actorHeldItemView(actor, actionTarget);
  drawActor(context, actor, scale, simulationTick, tickProgress, sprites, heldItemView);
  drawHeldItem(context, actor, heldItemView, scale, simulationTick, tickProgress, sprites);
}

function drawPlant(context, plant, scale, sprites) {
  const left = plant.position.x * scale;
  const top = plant.position.y * scale;
  const stage = plant.growthStage;
  const definition = getCropType(plant.cropType);
  const frameIndex = Math.floor(
    (Math.min(stage, plant.matureStage) / plant.matureStage)
      * (definition.spriteStages.length - 1),
  );
  if (drawSprite(
    context,
    sprites,
    definition.spriteStages[frameIndex],
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

export function rechargeStationFrameId(station) {
  if (station.charge <= 0) return "entity.recharge_station.empty";
  if (station.charge <= station.capacity * 0.25) return "entity.recharge_station.low";
  if (station.charge <= station.capacity * 0.625) return "entity.recharge_station.medium";
  return "item.recharge_station";
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

export function operationWorkView(state, actorId) {
  const actor = state.world.entities[actorId];
  const operation = actor?.activeIntent ? state.operations[actor.activeIntent] : null;
  if (!operation || operation.phase !== "working") return null;
  const selected = actor.inventory[actor.selectedSlot - 1];
  return {
    progress: clamp(
      (GAME_CONFIG.workCooldownTicks - operation.cooldown) / GAME_CONFIG.workCooldownTicks,
      0,
      1,
    ),
    itemId: operation.command.item?.itemId ?? selected?.itemId ?? null,
    action: operation.command.item?.action ?? "use_item",
  };
}

function drawWorkFeedback(context, actor, work, scale, sprites) {
  if (!work) return;
  const left = actor.position.x * scale;
  const top = actor.position.y * scale;
  context.fillStyle = "rgba(29, 31, 33, 0.85)";
  context.fillRect(left + 6, top + scale - 8, scale - 12, 5);
  context.fillStyle = actor.role === "robot" ? "#67d4d0" : "#f4d35e";
  context.fillRect(left + 7, top + scale - 7, (scale - 14) * work.progress, 3);
  if (work.itemId) {
    drawSprite(
      context,
      sprites,
      `item.${work.itemId}`,
      left + scale - 20,
      top + 2,
      18,
    );
  }
}

export function recentActionEffects(state, mapId, lifetimeTicks = 3, tickProgress = 0) {
  return state.history.filter((event) => (
    ["crop_harvested", "use_item"].includes(event.type)
      && event.target?.mapId === mapId
      && state.tick - event.tick >= 0
      && state.tick - event.tick <= lifetimeTicks
  )).map((event) => ({
    ...event,
    age: Math.min(1, ((state.tick - event.tick) + tickProgress) / lifetimeTicks),
  }));
}

function treeImpactAt(effects, object) {
  return effects.find((effect) => effect.type === "use_item"
    && effect.itemId === "axe"
    && effect.target.x === object.position.x
    && effect.target.y === object.position.y);
}

function drawSparkle(context, x, y, size) {
  context.fillRect(x - size, y, size * 2 + 1, 1);
  context.fillRect(x, y - size, 1, size * 2 + 1);
}

function drawActionEffects(context, effects, scale) {
  for (const effect of effects) {
    const left = effect.target.x * scale;
    const top = effect.target.y * scale;
    const lift = effect.age * 14;
    context.save();
    context.globalAlpha = 1 - effect.age;
    if (effect.type === "crop_harvested") {
      context.fillStyle = "#fff4a8";
      drawSparkle(context, left + 10, top + 13 - lift, 3);
      drawSparkle(context, left + 36, top + 8 - lift, 2);
      drawSparkle(context, left + 27, top + 31 - lift, 2);
      context.font = "bold 12px Georgia";
      context.textAlign = "center";
      context.strokeStyle = "rgba(44, 35, 31, 0.9)";
      context.lineWidth = 3;
      const label = `+${effect.quantity ?? 1}`;
      context.strokeText(label, left + (scale / 2), top + 9 - lift);
      context.fillText(label, left + (scale / 2), top + 9 - lift);
    } else {
      const colors = {
        axe: "#e7c08b",
        hoe: "#b87850",
        watering_can: "#75cfe8",
      };
      context.fillStyle = colors[effect.itemId] ?? "#b6df7a";
      drawSparkle(context, left + (scale / 2), top + (scale / 2), 4);
      context.fillRect(left + 10, top + 31, 4, 4);
      context.fillRect(left + 34, top + 17, 3, 3);
      if (effect.itemId === "axe") {
        const drift = effect.age * scale * 0.35;
        context.fillStyle = "#75aa4f";
        context.fillRect(left + 10 - drift, top + 9 + drift, 5, 3);
        context.fillStyle = "#9bc36b";
        context.fillRect(left + 31 + drift, top + 6 + (drift * 0.7), 4, 3);
        context.fillStyle = "#4f823f";
        context.fillRect(left + 23 - (drift * 0.4), top + 18 + drift, 4, 2);
      }
    }
    context.restore();
  }
}

export function tiredCueLayout(actor, simulationTick, tickProgress, scale) {
  const position = getActorRenderPosition(actor, simulationTick, tickProgress);
  const phase = ((simulationTick + tickProgress) * 0.22) % 1;
  return [0, 1, 2].map((index) => {
    const progress = (phase + (index * 0.28)) % 1;
    return {
      text: index === 0 ? "Z" : "z",
      x: (position.x * scale) + (scale * 0.68) + (index * scale * 0.13),
      y: (position.y * scale) + (scale * 0.25) - (progress * scale * 0.65),
      alpha: 1 - progress,
    };
  });
}

function drawTiredCue(context, actor, scale, simulationTick, tickProgress) {
  context.save();
  context.font = `bold ${Math.round(scale * 0.3)}px Georgia`;
  context.textAlign = "center";
  for (const cue of tiredCueLayout(actor, simulationTick, tickProgress, scale)) {
    context.globalAlpha = cue.alpha;
    context.lineWidth = 3;
    context.strokeStyle = "#3f2631";
    context.fillStyle = "#fff4cf";
    context.strokeText(cue.text, cue.x, cue.y);
    context.fillText(cue.text, cue.x, cue.y);
  }
  context.restore();
}

function drawTileFeedback(context, scale, preview, hoverTarget, actionTarget, currentMapId) {
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
  if (actionTarget?.mapId === currentMapId) {
    context.fillStyle = "rgba(244, 211, 94, 0.18)";
    context.fillRect(
      (actionTarget.x * scale) + 3,
      (actionTarget.y * scale) + 3,
      scale - 6,
      scale - 6,
    );
    context.strokeStyle = "#f4d35e";
    context.lineWidth = 2;
    context.strokeRect(
      (actionTarget.x * scale) + 5,
      (actionTarget.y * scale) + 5,
      scale - 10,
      scale - 10,
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
    actionTarget = null,
    focusActorId = "player",
    tiredActorIds = new Set(),
  } = {},
) {
  const scale = RENDER_TILE_SIZE;
  context.imageSmoothingEnabled = false;
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
  context.fillStyle = COLORS.mapBackdrop;
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
  const focusActor = state.world.entities[focusActorId];
  const focusPosition = getActorRenderPosition(
    focusActor,
    state.tick,
    tickProgress,
  );
  const currentMapId = focusActor.mapId;
  const currentMap = getWorldMap(state.world, currentMapId);
  const camera = computeCamera({
    focus: focusPosition,
    worldWidth: currentMap.width,
    worldHeight: currentMap.height,
    viewportWidth: context.canvas.width,
    viewportHeight: context.canvas.height,
    tileSize: scale,
  });
  context.save();
  context.translate(-camera.x, -camera.y);
  const actionEffects = recentActionEffects(state, currentMapId, 3, tickProgress);

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
    if (object.type === "tree") {
      drawTree(context, object, scale, sprites, treeImpactAt(actionEffects, object));
    }
    else if (object.type === "plant") drawPlant(context, object, scale, sprites);
    else if (object.type === "chest") {
      drawChest(context, object, scale, sprites, openEntityIds.has(object.id));
    }
    else if (object.type === "recharge_station") {
      drawSprite(
        context,
        sprites,
        rechargeStationFrameId(object),
        object.position.x * scale,
        object.position.y * scale,
        scale,
      );
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

  if (state.world.entities.player.mapId === currentMapId) {
    drawActorWithHeldItem(
      context,
      state.world.entities.player,
      scale,
      state.tick,
      tickProgress,
      sprites,
      focusActorId === "player" ? actionTarget : null,
    );
    drawWorkFeedback(
      context,
      state.world.entities.player,
      operationWorkView(state, "player"),
      scale,
      sprites,
    );
    if (tiredActorIds.has("player")
      && !state.world.entities.player.sleeping
      && state.world.entities.player.stamina < GAME_CONFIG.maxStamina) {
      drawTiredCue(context, state.world.entities.player, scale, state.tick, tickProgress);
    }
  }
  if (state.world.entities.robot.mapId === currentMapId) {
    drawActorWithHeldItem(
      context,
      state.world.entities.robot,
      scale,
      state.tick,
      tickProgress,
      sprites,
      null,
    );
    drawWorkFeedback(
      context,
      state.world.entities.robot,
      operationWorkView(state, "robot"),
      scale,
      sprites,
    );
    if (tiredActorIds.has("robot")
      && !state.world.entities.robot.sleeping
      && state.world.entities.robot.stamina < GAME_CONFIG.maxStamina) {
      drawTiredCue(context, state.world.entities.robot, scale, state.tick, tickProgress);
    }
  }
  drawTileFeedback(
    context,
    scale,
    operationPreview(state, focusActorId),
    hoverTarget,
    actionTarget,
    currentMapId,
  );
  drawActionEffects(context, actionEffects, scale);
  context.restore();
  return camera;
}