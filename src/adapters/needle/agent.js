const DEFAULT_CONFIDENCE_THRESHOLD = 0.5;
const NEEDLE_TOOL_DESCRIPTIONS = Object.freeze({
  inspect_game: "Read the robot state and nearby farm map.",
  move_to: "Travel to farm coordinates x and y without using an item or doing work.",
  interact_at: "Use an item or harvest at x and y. For travel without work, call move_to.",
  select_slot: "Select robot inventory slot 1 through 10.",
  sleep: "Put the robot to sleep while it is beside its charging berth.",
});

export function needleGameTools(tools) {
  return tools
    .filter((tool) => tool.name in NEEDLE_TOOL_DESCRIPTIONS)
    .map((tool) => ({ ...tool, description: NEEDLE_TOOL_DESCRIPTIONS[tool.name] }));
}

export function needleToolDefinitions(tools) {
  return tools.map(({ name, description, inputSchema }) => ({
    name,
    description,
    parameters: inputSchema ?? { type: "object", additionalProperties: false },
  }));
}

export function parseNeedleCalls(payload) {
  if (!payload) return [];
  const calls = JSON.parse(payload);
  if (!Array.isArray(calls)) throw new Error("Needle returned a non-array tool payload");
  return calls.map((call) => {
    if (!call || typeof call.name !== "string" || typeof call.arguments !== "object") {
      throw new Error("Needle returned an invalid tool call");
    }
    return call;
  });
}

export function createNeedleAgent({
  tools,
  infer,
  confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
}) {
  const toolsByName = new Map(tools.map((tool) => [tool.name, tool]));
  const definitions = needleToolDefinitions(tools);

  return {
    definitions,
    async run(prompt, options = {}) {
      const response = await infer(prompt, definitions);
      if (options.signal?.aborted) {
        return { status: "cancelled", confidence: response.confidence, calls: [], results: [] };
      }
      const confidence = response.confidence ?? 1;
      if (confidence < confidenceThreshold) {
        return {
          status: "low_confidence",
          confidence,
          calls: [],
          results: [],
        };
      }

      let calls;
      try {
        calls = parseNeedleCalls(response.payload);
      } catch (error) {
        return {
          status: "invalid_response",
          confidence,
          calls: [],
          results: [],
          error: error instanceof Error ? error.message : String(error),
        };
      }
      if (calls.length === 0) {
        return { status: "no_match", confidence, calls, results: [] };
      }

      const results = [];
      for (const call of calls) {
        const tool = toolsByName.get(call.name);
        if (!tool) throw new Error(`Needle selected unknown tool: ${call.name}`);
        const output = await tool.execute(call.arguments, { signal: options.signal });
        results.push({ name: call.name, arguments: call.arguments, output });
      }
      return { status: "completed", confidence, calls, results };
    },
  };
}