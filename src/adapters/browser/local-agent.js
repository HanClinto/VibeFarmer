import { createNeedleAgent } from "../needle/agent.js";
import { createNeedleModel } from "../needle/model.js";

function confidenceLabel(confidence) {
  return Number.isFinite(confidence) ? ` · ${Math.round(confidence * 100)}% confidence` : "";
}

export function createLocalAgent({ root, tools, webMcpSupported }) {
  const loadButton = root.querySelector("#local-agent-load");
  const progress = root.querySelector("#local-agent-progress");
  const status = root.querySelector("#local-agent-status");
  const transcript = root.querySelector("#local-agent-transcript");
  const form = root.querySelector("#local-agent-form");
  const input = root.querySelector("#local-agent-input");
  const sendButton = root.querySelector("#local-agent-send");
  const cancelButton = root.querySelector("#local-agent-cancel");
  let model = null;
  let agent = null;
  let activeController = null;

  status.textContent = webMcpSupported
    ? "WebMCP is available. Needle 2 is an optional on-device controller."
    : "WebMCP is unavailable. Load Needle 2 to control the robot on this device.";

  function appendMessage(kind, text, details) {
    const entry = document.createElement("div");
    entry.className = `local-agent-message local-agent-message-${kind}`;
    const label = document.createElement("strong");
    label.textContent = kind === "user" ? "You" : "Needle 2";
    const body = document.createElement("span");
    body.textContent = text;
    entry.append(label, body);
    if (details) {
      const output = document.createElement("pre");
      output.textContent = JSON.stringify(details, null, 2);
      entry.append(output);
    }
    transcript.append(entry);
    transcript.scrollTop = transcript.scrollHeight;
  }

  loadButton.addEventListener("click", async () => {
    loadButton.disabled = true;
    progress.hidden = false;
    status.textContent = "Starting local runtime...";
    try {
      model = createNeedleModel();
      const loaded = await model.load((update) => {
        if (update.stage === "download") {
          progress.max = update.total;
          progress.value = update.loaded;
          status.textContent = `Downloading Needle 2 · ${Math.round(update.loaded / 1_000_000)} MB`;
        } else {
          status.textContent = update.stage === "initialize"
            ? "Initializing Needle 2..."
            : "Starting local runtime...";
        }
      });
      agent = createNeedleAgent({
        tools,
        infer: (prompt, definitions) => model.infer(prompt, definitions),
      });
      progress.value = progress.max;
      status.textContent = `Ready · ${(loaded.bytes / 1_000_000).toFixed(1)} MB model · runs on this device`;
      input.disabled = false;
      sendButton.disabled = false;
      input.focus();
    } catch (error) {
      model?.dispose();
      model = null;
      loadButton.disabled = false;
      progress.hidden = true;
      status.textContent = `Could not load Needle 2: ${error.message}`;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const prompt = input.value.trim();
    if (!prompt || !agent || activeController) return;
    appendMessage("user", prompt);
    input.value = "";
    input.disabled = true;
    sendButton.disabled = true;
    cancelButton.disabled = false;
    activeController = new AbortController();
    status.textContent = "Needle 2 is choosing an action...";
    try {
      const result = await agent.run(prompt, { signal: activeController.signal });
      if (result.status === "completed") {
        const rejected = result.results.find(({ output }) => output?.success === false);
        const actionSummary = rejected
          ? `Called ${rejected.name}; game returned ${rejected.output.code}`
          : `Ran ${result.calls.map((call) => call.name).join(", ")}`;
        appendMessage(
          "agent",
          `${actionSummary}${confidenceLabel(result.confidence)}`,
          result.results.map(({ name, arguments: args, output }) => ({ name, arguments: args, output })),
        );
        status.textContent = "Ready";
      } else if (result.status === "low_confidence") {
        appendMessage("agent", `No action taken${confidenceLabel(result.confidence)}.`);
        status.textContent = "Request was below the confidence threshold";
      } else if (result.status === "cancelled") {
        appendMessage("agent", "Request cancelled. No new action was started.");
        status.textContent = "Ready";
      } else if (result.status === "invalid_response") {
        appendMessage("agent", "The local model returned an incomplete action. No action was taken.");
        status.textContent = "Ready";
      } else {
        appendMessage("agent", "No available game action matched that request.");
        status.textContent = "Ready";
      }
    } catch (error) {
      if (!activeController?.signal.aborted) {
        appendMessage("agent", `Request failed: ${error.message}`);
        status.textContent = "Ready";
      }
    } finally {
      activeController = null;
      input.disabled = !agent;
      sendButton.disabled = !agent;
      cancelButton.disabled = true;
      if (agent) input.focus();
    }
  });

  cancelButton.addEventListener("click", () => {
    if (!activeController) return;
    activeController.abort();
    model?.dispose();
    model = null;
    agent = null;
    loadButton.disabled = false;
    progress.hidden = true;
    input.disabled = true;
    sendButton.disabled = true;
    cancelButton.disabled = true;
    status.textContent = "Request cancelled. Reload Needle 2 to continue.";
    appendMessage("agent", "Request cancelled. No new action was started.");
  });

  return {
    open() {
      if (agent) input.focus();
      else loadButton.focus();
    },
    dispose() {
      activeController?.abort();
      model?.dispose();
    },
  };
}