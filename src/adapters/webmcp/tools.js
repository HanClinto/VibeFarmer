function result(success, code, details = {}) {
  return { success, code, ...details };
}

function publicEntity(entity, robotPosition) {
  const base = {
    id: entity.id,
    type: entity.type,
    position: entity.position ? { ...entity.position } : undefined,
  };
  if (entity.type === "tree") base.hitPoints = entity.hitPoints;
  if (entity.type === "plant") {
    base.cropType = entity.cropType;
    base.growthStage = entity.growthStage;
    base.matureStage = entity.matureStage;
  }
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
  if (entity.type === "chest" && robotPosition
    && Math.abs(entity.position.x - robotPosition.x)
      + Math.abs(entity.position.y - robotPosition.y) === 1) {
    base.inventory = entity.inventory;
  }
  return base;
}

export function inspectGame(controller, { includeHistory = false } = {}) {
  const state = controller.getSnapshot();
  const robot = state.world.entities.robot;
  return result(true, "GAME_INSPECTED", {
    tick: state.tick,
    day: state.day,
    money: state.money,
    terrain: state.world.terrain,
    entities: Object.values(state.world.entities)
      .sort((first, second) => first.id.localeCompare(second.id))
      .map((entity) => publicEntity(entity, robot.position)),
    operations: Object.values(state.operations),
    ...(includeHistory ? { history: state.history.slice(-50) } : {}),
  });
}

async function executeIntent(controller, command, signal) {
  if (signal?.aborted) return result(false, "TOOL_CANCELLED_BEFORE_SUBMISSION");
  const submission = controller.submit(command);
  if (!submission.success) return submission;

  const cancel = () => controller.cancel(submission.operationId);
  signal?.addEventListener("abort", cancel, { once: true });
  try {
    const completion = await submission.completion;
    const operation = controller.getSnapshot().operations[submission.operationId];
    return {
      ...completion,
      operationId: submission.operationId,
      submittedTick: operation.submittedTick,
      completedTick: operation.completedTick,
    };
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
      description: "Inspect the shared farm, robot state and inventory, visible entities, operations, and optionally recent history. Player inventory is private.",
      inputSchema: {
        type: "object",
        properties: {
          includeHistory: { type: "boolean", description: "Include the 50 most recent game events." },
        },
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
          target: { x, y },
        }, signal);
      },
    },
    {
      name: "interact_at",
      title: "Use robot item",
      description: "Move adjacent to a target and perform exactly one normal item use or harvest. Identify an owned item by slot or itemId; omit both to use the selected slot.",
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
          slot,
        }));
      },
    },
    {
      name: "buy_item",
      title: "Buy one item",
      description: "Buy exactly one item for the robot from the shared-money farm market.",
      inputSchema: {
        type: "object",
        properties: { itemId: { type: "string", enum: ["turnip_seeds"] } },
        required: ["itemId"],
        additionalProperties: false,
      },
      execute({ itemId }) {
        return Promise.resolve(controller.execute({
          type: "buy_item",
          actorId: "robot",
          itemId,
          quantity: 1,
        }));
      },
    },
    {
      name: "sell_item",
      title: "Sell one item",
      description: "Sell exactly one robot-held turnip or log to the shared-money farm market.",
      inputSchema: {
        type: "object",
        properties: { itemId: { type: "string", enum: ["turnip", "logs"] } },
        required: ["itemId"],
        additionalProperties: false,
      },
      execute({ itemId }) {
        return Promise.resolve(controller.execute({
          type: "sell_item",
          actorId: "robot",
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
      description: "Put the robot to sleep. The next day begins only when every farmhand is sleeping.",
      inputSchema: { type: "object", additionalProperties: false },
      execute() {
        return Promise.resolve(controller.execute({ type: "sleep_actor", actorId: "robot" }));
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