import initNeedle, { NeedleV2Wasm } from "../../../node_modules/needle-rs/needle_wasm.js";

const MODEL_URL = "https://huggingface.co/Cactus-Compute/needle2/resolve/main/needle2.cact";
const EXPECTED_MODEL_BYTES = 13_737_807;
let engine = null;

async function fetchModel(id) {
  const response = await fetch(MODEL_URL);
  if (!response.ok) throw new Error(`Needle 2 download failed (${response.status})`);
  const total = Number(response.headers.get("content-length")) || EXPECTED_MODEL_BYTES;
  if (!response.body) return new Uint8Array(await response.arrayBuffer());

  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
    loaded += value.length;
    self.postMessage({ id, type: "progress", progress: { stage: "download", loaded, total } });
  }
  const bytes = new Uint8Array(loaded);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}

async function load(id) {
  if (engine) return { bytes: EXPECTED_MODEL_BYTES, cached: true };
  self.postMessage({ id, type: "progress", progress: { stage: "runtime" } });
  await initNeedle();
  const model = await fetchModel(id);
  self.postMessage({ id, type: "progress", progress: { stage: "initialize" } });
  engine = NeedleV2Wasm.load(model);
  if (!engine) throw new Error("Needle 2 could not initialize");
  return { bytes: model.length, cached: false };
}

self.addEventListener("message", async ({ data }) => {
  try {
    let result;
    if (data.type === "load") {
      result = await load(data.id);
    } else if (data.type === "infer") {
      if (!engine) throw new Error("Load Needle 2 before sending a request");
      const descriptions = data.tools.map(({ name, description }) => `${name}: ${description}`);
      const ranked = JSON.parse(engine.retrieve_tools(
        data.prompt,
        JSON.stringify(descriptions),
        1,
      ));
      const selectedTools = ranked.length > 0 ? [data.tools[ranked[0][0]]] : data.tools;
      const toolsJson = JSON.stringify(selectedTools);
      const completion = engine.generate(data.prompt, toolsJson, 256, 0, 0, true);
      const match = completion.match(/<tool_call>([\s\S]*?)<\/tool_call>/);
      result = {
        payload: match?.[1] ?? "",
        confidence: engine.confidence_for(data.prompt, toolsJson, completion),
      };
    } else {
      throw new Error(`Unknown Needle worker request: ${data.type}`);
    }
    self.postMessage({ id: data.id, type: "result", result });
  } catch (error) {
    self.postMessage({
      id: data.id,
      type: "error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});