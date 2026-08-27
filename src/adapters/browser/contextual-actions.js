const NEIGHBORS = Object.freeze([
  Object.freeze({ x: 0, y: -1 }),
  Object.freeze({ x: 1, y: 0 }),
  Object.freeze({ x: 0, y: 1 }),
  Object.freeze({ x: -1, y: 0 }),
]);

const PRIORITY = Object.freeze({ sleep: 0, market: 1, storage: 2 });

export function contextualActions(state, inspect, viewerId = "player") {
  const viewer = state.world.entities[viewerId];
  if (!viewer?.position) return [];
  const actions = [];

  for (const offset of NEIGHBORS) {
    const inspection = inspect(state, viewerId, {
      mapId: viewer.mapId,
      x: viewer.position.x + offset.x,
      y: viewer.position.y + offset.y,
    });
    if (!inspection.success) continue;
    for (const entity of inspection.entities) {
      if (entity.canSleep) {
        actions.push({ type: "sleep", entityId: entity.id, label: "Sleep" });
      } else if (entity.canTrade) {
        actions.push({ type: "market", entityId: entity.id, label: "Open Market" });
      } else if (entity.inventory && (entity.type === "chest" || entity.role === "robot")) {
        actions.push({
          type: "storage",
          entityId: entity.id,
          label: entity.type === "chest" ? "Open Chest" : "Open Robot Storage",
        });
      }
    }
  }

  return actions.sort((first, second) => (
    PRIORITY[first.type] - PRIORITY[second.type]
      || first.entityId.localeCompare(second.entityId)
  ));
}