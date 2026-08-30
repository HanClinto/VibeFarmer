import assert from "node:assert/strict";
import test from "node:test";

import {
  createNeedleAgent,
  needleGameTools,
  needleToolDefinitions,
  parseNeedleCalls,
} from "../src/adapters/needle/agent.js";

const tool = {
  name: "move_to",
  description: "Move the robot",
  inputSchema: {
    type: "object",
    properties: { x: { type: "integer" }, y: { type: "integer" } },
    required: ["x", "y"],
  },
  async execute(input) {
    return { success: true, target: input };
  },
};

test("Needle receives the existing game schemas as parameters", () => {
  assert.deepEqual(needleToolDefinitions([tool]), [{
    name: "move_to",
    description: "Move the robot",
    parameters: tool.inputSchema,
  }]);
});

test("Needle uses five compact core game tools", () => {
  const tools = [
    tool,
    { ...tool, name: "inspect_game" },
    { ...tool, name: "interact_at" },
    { ...tool, name: "select_slot" },
    { ...tool, name: "sleep" },
    { ...tool, name: "buy_item" },
  ];
  const compact = needleGameTools(tools);

  assert.deepEqual(compact.map(({ name }) => name), [
    "move_to",
    "inspect_game",
    "interact_at",
    "select_slot",
    "sleep",
  ]);
  assert.equal(compact.some(({ name }) => name === "buy_item"), false);
  assert.equal(compact.every(({ description }) => description.length < 80), true);
});

test("Needle calls execute the matching local game tool", async () => {
  const agent = createNeedleAgent({
    tools: [tool],
    infer: async () => ({
      payload: '[{"name":"move_to","arguments":{"x":4,"y":6}}]',
      confidence: 0.9,
    }),
  });

  const result = await agent.run("Move to 4, 6");
  assert.equal(result.status, "completed");
  assert.deepEqual(result.results, [{
    name: "move_to",
    arguments: { x: 4, y: 6 },
    output: { success: true, target: { x: 4, y: 6 } },
  }]);
});

test("low-confidence and empty calls do not execute tools", async () => {
  let executions = 0;
  const trackedTool = { ...tool, execute: async () => { executions += 1; } };
  const lowConfidence = createNeedleAgent({
    tools: [trackedTool],
    infer: async () => ({ payload: '[{"name":"move_to","arguments":{"x":1,"y":1}}]', confidence: 0.2 }),
  });
  const noMatch = createNeedleAgent({
    tools: [trackedTool],
    infer: async () => ({ payload: "[]", confidence: 0.9 }),
  });

  assert.equal((await lowConfidence.run("maybe move")).status, "low_confidence");
  assert.equal((await noMatch.run("write a poem")).status, "no_match");
  assert.equal(executions, 0);
});

test("malformed and unknown calls are rejected", async () => {
  assert.throws(() => parseNeedleCalls("{}"), /non-array/);
  const malformed = createNeedleAgent({
    tools: [tool],
    infer: async () => ({ payload: '[{"name":"move_to"' }),
  });
  assert.equal((await malformed.run("move")).status, "invalid_response");
  const agent = createNeedleAgent({
    tools: [tool],
    infer: async () => ({ payload: '[{"name":"delete_save","arguments":{}}]' }),
  });
  await assert.rejects(() => agent.run("delete everything"), /unknown tool/);
});