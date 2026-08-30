import assert from "node:assert/strict";
import test from "node:test";

import { createNeedleModel } from "../src/adapters/needle/model.js";

function fakeWorker() {
  let listener;
  return {
    messages: [],
    terminated: false,
    addEventListener(_type, nextListener) { listener = nextListener; },
    postMessage(message) { this.messages.push(message); },
    terminate() { this.terminated = true; },
    emit(data) { listener({ data }); },
  };
}

test("Needle model client correlates progress and inference responses", async () => {
  const worker = fakeWorker();
  const model = createNeedleModel({ worker });
  const progress = [];
  const loading = model.load((update) => progress.push(update));
  const loadRequest = worker.messages[0];
  worker.emit({ id: loadRequest.id, type: "progress", progress: { stage: "runtime" } });
  worker.emit({ id: loadRequest.id, type: "result", result: { bytes: 10 } });

  assert.deepEqual(await loading, { bytes: 10 });
  assert.deepEqual(progress, [{ stage: "runtime" }]);

  const inference = model.infer("move", [{ name: "move_to" }]);
  const inferRequest = worker.messages[1];
  assert.deepEqual(inferRequest, {
    id: 2,
    type: "infer",
    prompt: "move",
    tools: [{ name: "move_to" }],
  });
  worker.emit({ id: inferRequest.id, type: "result", result: { payload: "[]" } });
  assert.deepEqual(await inference, { payload: "[]" });
});

test("Needle model client surfaces worker failures and disposal", async () => {
  const worker = fakeWorker();
  const model = createNeedleModel({ worker });
  const inference = model.infer("move", []);
  worker.emit({ id: 1, type: "error", message: "model failed" });

  await assert.rejects(inference, /model failed/);
  model.dispose();
  assert.equal(worker.terminated, true);
});