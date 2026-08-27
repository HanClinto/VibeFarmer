const ACTION_TYPES = new Set([
  "use_item",
  "crop_harvested",
  "item_bought",
  "item_sold",
  "item_transferred",
  "robot_recharged",
]);

function actorStats() {
  return {
    tilesTraversed: 0,
    actionsTaken: 0,
    toolUses: 0,
    cropsHarvested: 0,
    itemsBought: 0,
    itemsSold: 0,
    itemsTransferred: 0,
  };
}

export function createDayStats(day) {
  return {
    day,
    actors: {
      player: actorStats(),
      robot: actorStats(),
    },
    world: {
      cropsGrown: 0,
      cropsHarvested: 0,
      moneyEarned: 0,
      moneySpent: 0,
    },
  };
}

function statsForActor(stats, actorId) {
  stats.actors[actorId] ??= actorStats();
  return stats.actors[actorId];
}

export function recordDayEvent(state, event) {
  if (!state.dayStats || state.dayStats.day !== state.day) {
    state.dayStats = createDayStats(state.day);
  }
  const stats = state.dayStats;
  const actorId = event.actorId ?? event.requesterId;
  if (event.type === "move" && actorId) {
    statsForActor(stats, actorId).tilesTraversed += 1;
  }
  if (ACTION_TYPES.has(event.type) && actorId) {
    statsForActor(stats, actorId).actionsTaken += 1;
  }
  if (event.type === "use_item") statsForActor(stats, actorId).toolUses += 1;
  if (event.type === "crop_harvested") {
    const quantity = event.quantity ?? 1;
    statsForActor(stats, actorId).cropsHarvested += quantity;
    stats.world.cropsHarvested += quantity;
  }
  if (event.type === "item_bought") {
    statsForActor(stats, actorId).itemsBought += event.quantity;
    stats.world.moneySpent += event.totalPrice;
  }
  if (event.type === "item_sold") {
    statsForActor(stats, actorId).itemsSold += event.quantity;
    stats.world.moneyEarned += event.totalPrice;
  }
  if (event.type === "item_transferred") {
    statsForActor(stats, actorId).itemsTransferred += event.quantity;
  }
  if (event.type === "crop_grew") stats.world.cropsGrown += 1;
}

export function finalizeDaySummary(state) {
  return JSON.parse(JSON.stringify({
    ...state.dayStats,
    endingBalance: state.money,
  }));
}