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