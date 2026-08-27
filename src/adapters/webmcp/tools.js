function result(success, code, details = {}) {
  return { success, code, ...details };
}

import { CROP_TYPES, getCropType } from "../../game/world/entities/plants/crop-types.js";
import { ITEM_TYPES } from "../../game/world/entities/items/item-types.js";

const BUY_ITEM_IDS = Object.freeze(Object.values(ITEM_TYPES)
  .filter((item) => item.buyPrice)
  .map((item) => item.id));
const PRODUCE_ITEM_IDS = Object.freeze(Object.values(CROP_TYPES).map(
  (crop) => crop.produceItemId,
));

function marketInventory() {
  const items = Object.values(ITEM_TYPES);
  return {
    buy: items.filter((item) => item.buyPrice).map((item) => ({
      itemId: item.id,
      name: item.name,
      category: item.category,
      price: item.buyPrice,
    })),
    sell: items.filter((item) => item.sellPrice).map((item) => ({
      itemId: item.id,
      name: item.name,
      category: item.category,
      price: item.sellPrice,
    })),
  };
}

const DEFAULT_INSPECTION_TYPES = Object.freeze([
  "actor",
  "bed",
  "chest",
  "market",
  "plant",
  "portal",
  "rock",
  "tree",
]);

const TERRAIN_SYMBOLS = Object.freeze({
  grass: ".",
  path: ":",
  tilled: "=",
  wet_tilled: "W",
  water: "~",
  floor: "_",
});

const ENTITY_SYMBOLS = Object.freeze({
  bed: "B",
  chest: "C",
  decoration: "#",
  market: "M",
  portal: "D",
  rock: "O",
  tree: "T",
});

function robotState(state) {
  const robot = state.world.entities.robot;
  return {
    mapId: robot.mapId,
    position: { ...robot.position },
    facing: robot.facing,
    stamina: robot.stamina,
    sleeping: robot.sleeping,
    selectedSlot: robot.selectedSlot,
    inventory: robot.inventory.map((stack) => (stack ? { ...stack } : null)),
    activeIntent: robot.activeIntent,
  };
}

function recoverableNextActions(output) {
  if (output.success) {
    return ["inspect_game", "move_to", "interact_at", "transfer_item", "sleep"];
  }
  if (output.code === "ACTOR_BUSY") return ["inspect_game", "cancel_operation"];
  if (output.code === "NOT_ENOUGH_STAMINA") return ["sleep", "inspect_game"];
  if (["ITEM_NOT_FOUND", "INVALID_INVENTORY_SLOT"].includes(output.code)) {
    return ["inspect_game", "select_slot"];
  }
  return ["inspect_game", "move_to"];
}

function resolvedItem(completion) {
  const action = completion.action;
  if (action?.itemId) return { itemId: action.itemId, slot: action.slot };
  if (action?.cropType) return { action: "harvest", cropType: action.cropType };
  return null;
}

function structuredIntentResult(controller, output, operation, historyStart) {
  const state = controller.getSnapshot();
  const events = state.history.slice(historyStart).filter((event) => (
    event.operationId === operation?.operationId || event.actorId === "robot"
  ));
  return {
    ...output,
    operationId: operation?.operationId ?? output.operationId ?? null,
    submittedTick: operation?.submittedTick ?? null,
    completedTick: operation?.completedTick ?? null,
    resolvedItem: resolvedItem(output),
    finalPosition: { ...state.world.entities.robot.position },
    pathResult: operation ? {
      status: operation.status,
      replanCount: operation.replanCount,
      replanned: operation.replanCount > 0,
      remainingSteps: operation.path.length,
    } : null,
    changedState: {
      eventTypes: events.map((event) => event.type),
      events,
    },
    robot: robotState(state),
    recoverableNextActions: recoverableNextActions(output),
  };
}

function publicEntity(entity, robot, map) {
  const base = {
    id: entity.id,
    type: entity.type,
    mapId: entity.mapId,
    position: entity.position ? { ...entity.position } : undefined,
  };
  if (entity.type === "tree") base.hitPoints = entity.hitPoints;
  if (entity.type === "plant") {
    const crop = getCropType(entity.cropType);
    base.cropType = entity.cropType;
    base.growthStage = entity.growthStage;
    base.matureStage = entity.matureStage;
    base.watered = map.terrain[entity.position.y][entity.position.x] === "wet_tilled";
    base.regrows = Boolean(crop.regrowDays);
    base.yield = { ...crop.yield };
  }
  if (entity.type === "portal") base.destination = { ...entity.destination };
  if (entity.type === "bed") base.actorId = entity.actorId;
  if (entity.type === "market") base.name = entity.name ?? "Farm Market";
  if (entity.type === "actor") {
    base.role = entity.role;
    base.sleeping = entity.sleeping;
    base.stamina = entity.stamina;
    if (entity.role === "robot") {
      base.selectedSlot = entity.selectedSlot;
      base.inventory = entity.inventory;
      base.activeIntent = entity.activeIntent;
    }
  }
  if (entity.type === "chest") {
    base.capacity = entity.inventory.length;
    base.usedSlots = entity.inventory.filter(Boolean).length;
    if (robot
      && entity.mapId === robot.mapId
      && Math.abs(entity.position.x - robot.position.x)
        + Math.abs(entity.position.y - robot.position.y) === 1) {
      base.inventory = entity.inventory;
    }
  }
  return base;
}

function entitySymbol(entity, map) {
  if (entity.type === "actor") return entity.role === "robot" ? "R" : "P";
  if (entity.type === "plant") {
    const watered = map.terrain[entity.position.y][entity.position.x] === "wet_tilled";
    if (entity.growthStage >= entity.matureStage) return watered ? "H" : "h";
    return watered ? "G" : "g";
  }
  return ENTITY_SYMBOLS[entity.type] ?? "?";
}

function inspectionBounds(map, center, radius) {
  return {
    left: Math.max(0, center.x - radius),
    top: Math.max(0, center.y - radius),
    right: Math.min(map.width - 1, center.x + radius),
    bottom: Math.min(map.height - 1, center.y + radius),
  };
}

function inBounds(entity, bounds, mapId) {
  return entity.mapId === mapId
    && entity.position
    && entity.position.x >= bounds.left
    && entity.position.x <= bounds.right
    && entity.position.y >= bounds.top
    && entity.position.y <= bounds.bottom;
}

export function asciiMap(map, entities, bounds) {
  const cells = [];
  for (let y = bounds.top; y <= bounds.bottom; y += 1) {
    const row = [];
    for (let x = bounds.left; x <= bounds.right; x += 1) {
      row.push(TERRAIN_SYMBOLS[map.terrain[y][x]] ?? "?");
    }
    cells.push(row);
  }
  const priority = ["decoration", "portal", "market", "bed", "chest", "rock", "tree", "plant", "actor"];
  for (const entity of [...entities].sort(
    (first, second) => priority.indexOf(first.type) - priority.indexOf(second.type),
  )) {
    cells[entity.position.y - bounds.top][entity.position.x - bounds.left] = entitySymbol(
      entity,
      map,
    );
  }
  const xCoordinates = Array.from(
    { length: bounds.right - bounds.left + 1 },
    (_value, index) => bounds.left + index,
  );
  const xTens = xCoordinates.map((coordinate) => (
    coordinate >= 10 ? String(Math.floor(coordinate / 10) % 10) : " "
  )).join("");
  const xOnes = xCoordinates.map((coordinate) => String(coordinate % 10)).join("");
  const rows = cells.map(
    (row, index) => `${String(bounds.top + index).padStart(2, "0")} ${row.join("")}`,
  );
  return `   ${xTens}\n   ${xOnes}\n${rows.join("\n")}`;
}

export function inspectGame(controller, {
  mode = "compact",
  radius = 6,
  mapId,
  x,
  y,
  entityTypes,
  includeHistory = false,
  historyLimit = 20,
} = {}) {
  const state = controller.getSnapshot();
  const robot = state.world.entities.robot;
  const selectedMapId = mapId ?? robot.mapId;
  const map = state.world.maps[selectedMapId];
  if (!map) return result(false, "MAP_NOT_FOUND", { mapId: selectedMapId });
  const center = {
    x: Math.min(map.width - 1, Math.max(0, x ?? robot.position.x)),
    y: Math.min(map.height - 1, Math.max(0, y ?? robot.position.y)),
  };
  const boundedRadius = Math.min(12, Math.max(1, radius));
  const mapEntities = Object.values(state.world.entities)
    .filter((entity) => entity.mapId === selectedMapId);
  const allTypes = [...new Set(mapEntities.map((entity) => entity.type))];
  const selectedTypes = new Set(
    entityTypes ?? (mode === "detailed" ? allTypes : DEFAULT_INSPECTION_TYPES),
  );
  const bounds = inspectionBounds(map, center, boundedRadius);
  const entities = mapEntities
    .filter((entity) => selectedTypes.has(entity.type))
    .filter((entity) => mode === "detailed" || inBounds(entity, bounds, selectedMapId))
    .sort((first, second) => first.id.localeCompare(second.id));
  const entityCounts = {};
  const cropCounts = {};
  for (const entity of mapEntities) {
    entityCounts[entity.type] = (entityCounts[entity.type] ?? 0) + 1;
    if (entity.type === "plant") {
      cropCounts[entity.cropType] = (cropCounts[entity.cropType] ?? 0) + 1;
    }
  }
  const activeOperations = Object.values(state.operations).filter(
    (operation) => !["completed", "failed", "cancelled"].includes(operation.status),
  );
  return result(true, "GAME_INSPECTED", {
    tick: state.tick,
    day: state.day,
    money: state.money,
    market: marketInventory(),
    robot: robotState(state),
    map: { id: selectedMapId, width: map.width, height: map.height },
    entityCounts,
    cropCounts,
    view: {
      center,
      radius: boundedRadius,
      bounds,
      ascii: asciiMap(map, mapEntities.filter(
        (entity) => inBounds(entity, bounds, selectedMapId),
      ), bounds),
      legend: {
        terrain: ". grass, : path, = tilled, W watered, ~ water, _ floor",
        entities: "R robot, P player, T tree, g dry growing crop, G watered growing crop, h dry harvest-ready crop, H watered harvest-ready crop, C chest, B bed, M market, D door, O rock",
      },
    },
    entities: entities.map((entity) => publicEntity(entity, robot, map)),
    operations: mode === "detailed" ? Object.values(state.operations) : activeOperations,
    ...(mode === "detailed" ? { terrain: map.terrain } : {}),
    ...(includeHistory ? { history: state.history.slice(-historyLimit) } : {}),
  });
}

async function executeIntent(controller, command, signal) {
  if (signal?.aborted) {
    const historyStart = controller.getSnapshot().history.length;
    return structuredIntentResult(
      controller,
      result(false, "TOOL_CANCELLED_BEFORE_SUBMISSION"),
      null,
      historyStart,
    );
  }
  const submission = controller.submit(command);
  const historyStart = controller.getSnapshot().history.length;
  if (!submission.success) {
    return structuredIntentResult(controller, submission, null, historyStart);
  }

  const cancel = () => controller.cancel(submission.operationId);
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const completion = await submission.completion;
    const operation = controller.getSnapshot().operations[submission.operationId];
    return structuredIntentResult(controller, completion, operation, historyStart);
  } finally {
    signal?.removeEventListener("abort", cancel);
  }
}

export function createWebMcpTools(controller, { onInvocation = () => {} } = {}) {
  let nextInvocationId = 1;
  const tools = [
    {
      name: "inspect_game",
      title: "Inspect game",
      description: "Inspect the robot, current market inventory and prices, and a compact ASCII area around the robot by default. Optionally choose a map, center, radius, entity types, bounded history, or detailed mode with the full terrain matrix. Player inventory is private.",
      inputSchema: {
        type: "object",
        properties: {
          mode: { type: "string", enum: ["compact", "detailed"], description: "Compact omits repetitive terrain JSON; detailed includes the selected map's full terrain and all matching entities." },
          mapId: { type: "string", description: "Map to inspect; defaults to the robot's current map." },
          x: { type: "integer", minimum: 0, description: "View center X; defaults to the robot." },
          y: { type: "integer", minimum: 0, description: "View center Y; defaults to the robot." },
          radius: { type: "integer", minimum: 1, maximum: 12, description: "Compact square radius around the center; defaults to 6." },
          entityTypes: {
            type: "array",
            uniqueItems: true,
            items: { type: "string", enum: ["actor", "bed", "chest", "decoration", "market", "plant", "portal", "rock", "tree"] },
            description: "Only return records for these entity types. The ASCII map retains all visible objects as spatial context. Compact records exclude decorations by default.",
          },
          includeHistory: { type: "boolean", description: "Include recent game events." },
          historyLimit: { type: "integer", minimum: 1, maximum: 50, description: "Maximum history records; defaults to 20." },
        },
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true },
      execute(input) {
        return Promise.resolve(inspectGame(controller, input));
      },
    },
    {
      name: "move_to",
      title: "Move robot",
      description: "Move the robot to one reachable walkable tile. The call completes only after simulated movement finishes.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "integer" },
          y: { type: "integer" },
        },
        required: ["x", "y"],
        additionalProperties: false,
      },
      execute({ x, y }, { signal } = {}) {
        return executeIntent(controller, {
          type: "move_to",
          actorId: "robot",
          source: "webmcp",
          target: { x, y },
        }, signal);
      },
    },
    {
      name: "interact_at",
      title: "Use robot item",
      description: "Move adjacent to a target and perform exactly one normal item use or harvest. Mature crops are harvested regardless of the held item. Otherwise, identify an owned item by slot or itemId; omit both to use the selected slot.",
      inputSchema: {
        type: "object",
        properties: {
          x: { type: "integer" },
          y: { type: "integer" },
          slot: { type: "integer", minimum: 1, maximum: 10 },
          itemId: { type: "string" },
          action: { type: "string", enum: ["harvest"] },
        },
        required: ["x", "y"],
        additionalProperties: false,
      },
      execute({ x, y, slot, itemId, action }, { signal } = {}) {
        const item = action ? { action } : { slot, itemId };
        return executeIntent(controller, {
          type: "interact_at",
          actorId: "robot",
          source: "webmcp",
          target: { x, y },
          item,
        }, signal);
      },
    },
    {
      name: "select_slot",
      title: "Select robot slot",
      description: "Select one of the robot's ten inventory slots without using it.",
      inputSchema: {
        type: "object",
        properties: { slot: { type: "integer", minimum: 1, maximum: 10 } },
        required: ["slot"],
        additionalProperties: false,
      },
      execute({ slot }) {
        return Promise.resolve(controller.execute({
          type: "select_slot",
          actorId: "robot",
          source: "webmcp",
          slot,
        }));
      },
    },
    {
      name: "buy_item",
      title: "Buy one item",
      description: "Buy exactly one currently stocked market item for the robot while it is adjacent to the shared-money farm market. Call inspect_game to list item IDs and current prices.",
      inputSchema: {
        type: "object",
        properties: { itemId: { type: "string", enum: BUY_ITEM_IDS } },
        required: ["itemId"],
        additionalProperties: false,
      },
      execute({ itemId }) {
        return Promise.resolve(controller.execute({
          type: "buy_item",
          actorId: "robot",
          source: "webmcp",
          itemId,
          quantity: 1,
        }));
      },
    },
    {
      name: "sell_item",
      title: "Sell one item",
      description: "Sell exactly one robot-held crop or log while adjacent to the shared-money farm market.",
      inputSchema: {
        type: "object",
        properties: { itemId: { type: "string", enum: [...PRODUCE_ITEM_IDS, "logs"] } },
        required: ["itemId"],
        additionalProperties: false,
      },
      execute({ itemId }) {
        return Promise.resolve(controller.execute({
          type: "sell_item",
          actorId: "robot",
          source: "webmcp",
          itemId,
          quantity: 1,
        }));
      },
    },
    {
      name: "transfer_item",
      title: "Transfer one robot item",
      description: "Transfer exactly one item between the robot and an adjacent chest, or deliver one robot-held item to adjacent free player capacity. The robot cannot inspect or withdraw player inventory.",
      inputSchema: {
        type: "object",
        properties: {
          fromEntityId: { type: "string" },
          toEntityId: { type: "string" },
          itemId: { type: "string" },
        },
        required: ["fromEntityId", "toEntityId", "itemId"],
        additionalProperties: false,
      },
      execute({ fromEntityId, toEntityId, itemId }) {
        return Promise.resolve(controller.execute({
          type: "transfer_item",
          actorId: "robot",
          source: "webmcp",
          fromEntityId,
          toEntityId,
          itemId,
          quantity: 1,
        }));
      },
    },
    {
      name: "sleep",
      title: "Put robot to sleep",
      description: "Put the robot to sleep while adjacent to its charging berth. If the idle player is already beside their bed, they are treated as ready and the day advances; otherwise the robot waits.",
      inputSchema: { type: "object", additionalProperties: false },
      execute() {
        return Promise.resolve(controller.execute({
          type: "sleep_actor",
          actorId: "robot",
          source: "webmcp",
        }));
      },
    },
    {
      name: "cancel_operation",
      title: "Cancel robot operation",
      description: "Request cancellation of one active robot operation at the next safe simulation tick.",
      inputSchema: {
        type: "object",
        properties: { operationId: { type: "string" } },
        required: ["operationId"],
        additionalProperties: false,
      },
      execute({ operationId }) {
        return Promise.resolve(controller.cancel(operationId));
      },
    },
  ];

  return tools.map((tool) => {
    const execute = tool.execute;
    return {
      ...tool,
      async execute(input = {}, options = {}) {
        const invocation = {
          invocationId: `tool-call-${nextInvocationId}`,
          toolName: tool.name,
          input,
          status: "running",
          startedAt: Date.now(),
        };
        nextInvocationId += 1;
        onInvocation({ ...invocation });
        try {
          const output = await execute(input, options);
          invocation.status = "completed";
          invocation.output = output;
          invocation.durationMs = Date.now() - invocation.startedAt;
          onInvocation({ ...invocation });
          return output;
        } catch (error) {
          invocation.status = "failed";
          invocation.error = error instanceof Error ? error.message : String(error);
          invocation.durationMs = Date.now() - invocation.startedAt;
          onInvocation({ ...invocation });
          throw error;
        }
      },
    };
  });
}