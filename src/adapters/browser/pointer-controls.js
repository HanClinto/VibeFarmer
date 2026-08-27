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
  const entities = Object.values(state.world.entities).filter(
    (entity) => entity.mapId === target.mapId
      && entity.position?.x === target.x
      && entity.position?.y === target.y,
  );
  const portal = entities.find((entity) => entity.type === "portal");
  if (!shiftKey && entities.length > 0 && !portal) {
    return { kind: "inspect", target: { ...target } };
  }

  const player = state.world.entities.player;
  const selectedItem = player.inventory[player.selectedSlot - 1];
  return {
    kind: "submit",
    command: {
      type: shiftKey ? "interact_at" : "move_to",
      actorId: "player",
      target: { ...target },
      item: shiftKey && selectedItem === null ? { action: "harvest" } : undefined,
    },
  };
}