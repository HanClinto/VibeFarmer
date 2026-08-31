import {
  isWalkable,
  validateHarvest,
  validateUseItem,
} from "../../game/actions/actions.js";

const FACING_OFFSETS = Object.freeze({
  north: { x: 0, y: -1 },
  east: { x: 1, y: 0 },
  south: { x: 0, y: 1 },
  west: { x: -1, y: 0 },
});

export function actionTargetForPointer(player, pointerTarget) {
  if (!pointerTarget || pointerTarget.mapId !== player.mapId) return null;
  const deltaX = pointerTarget.x - player.position.x;
  const deltaY = pointerTarget.y - player.position.y;
  let offset = FACING_OFFSETS[player.facing];
  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    offset = FACING_OFFSETS[deltaX < 0 ? "west" : "east"];
  } else if (deltaY !== 0) {
    offset = FACING_OFFSETS[deltaY < 0 ? "north" : "south"];
  }
  return {
    mapId: player.mapId,
    x: player.position.x + offset.x,
    y: player.position.y + offset.y,
  };
}

export function actionForCanvasClick(state, target, { shiftKey = false } = {}) {
  if (shiftKey) return { kind: "inspect", target: { ...target } };

  const entities = Object.values(state.world.entities).filter(
    (entity) => entity.mapId === target.mapId
      && entity.position?.x === target.x
      && entity.position?.y === target.y,
  );
  const portal = entities.find((entity) => entity.type === "portal");
  if (portal) {
    return {
      kind: "submit",
      command: {
        type: "move_to",
        actorId: "player",
        target: { ...target },
      },
    };
  }

  const player = state.world.entities.player;
  const harvest = validateHarvest(state, "player", target, { requireAdjacent: false });
  if (harvest.success || harvest.code === "INVENTORY_FULL") {
    return {
      kind: "submit",
      command: {
        type: "interact_at",
        actorId: "player",
        target: { ...target },
        item: { action: "harvest" },
      },
    };
  }

  const selectedItem = player.inventory[player.selectedSlot - 1];
  if (selectedItem) {
    const itemUse = validateUseItem(state, "player", target, {}, { requireAdjacent: false });
    if (itemUse.success || ["NOT_ENOUGH_STAMINA", "INVENTORY_FULL"].includes(itemUse.code)) {
      return {
        kind: "submit",
        command: {
          type: "interact_at",
          actorId: "player",
          target: { ...target },
        },
      };
    }
  }

  if (entities.length === 0 && isWalkable(state, target, "player")) {
    return {
      kind: "submit",
      command: {
        type: "move_to",
        actorId: "player",
        target: { ...target },
      },
    };
  }

  return { kind: "inspect", target: { ...target } };
}