export function createNeedleModel({
  worker = new Worker(new URL("./worker.js", import.meta.url), { type: "module" }),
} = {}) {
  let nextRequestId = 1;
  const pending = new Map();

  worker.addEventListener("message", ({ data }) => {
    const request = pending.get(data.id);
    if (!request) return;
    if (data.type === "progress") {
      request.onProgress?.(data.progress);
      return;
    }
    pending.delete(data.id);
    if (data.type === "error") request.reject(new Error(data.message));
    else request.resolve(data.result);
  });

  function request(type, body = {}, onProgress) {
    const id = nextRequestId;
    nextRequestId += 1;
    return new Promise((resolve, reject) => {
      pending.set(id, { resolve, reject, onProgress });
      worker.postMessage({ id, type, ...body });
    });
  }

  return {
    load(onProgress) {
      return request("load", {}, onProgress);
    },
    infer(prompt, tools) {
      return request("infer", { prompt, tools });
    },
    dispose() {
      worker.terminate();
      for (const { reject } of pending.values()) reject(new Error("Needle model disposed"));
      pending.clear();
    },
  };
}