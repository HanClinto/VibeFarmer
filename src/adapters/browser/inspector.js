function formatted(value) {
  return JSON.stringify(value, null, 2);
}

function sampleInput(tool) {
  const samples = {
    inspect_game: { includeHistory: false },
    move_to: { x: 3, y: 3 },
    interact_at: { x: 8, y: 2, itemId: "axe" },
    select_slot: { slot: 1 },
    buy_item: { itemId: "turnip_seeds" },
    sell_item: { itemId: "logs" },
    transfer_item: {
      fromEntityId: "robot",
      toEntityId: "chest-1",
      itemId: "turnip_seeds",
    },
    sleep: {},
    cancel_operation: { operationId: "operation-1" },
  };
  return samples[tool.name] ?? {};
}

export function createInspector({
  root,
  controller,
  tools,
  invocationLog,
  webMcpSupported,
}) {
  const tabButtons = [...root.querySelectorAll("button[data-inspector-tab]")];
  const panels = [...root.querySelectorAll("[data-inspector-panel]")];
  const overview = root.querySelector("#inspector-overview");
  const toolSelect = root.querySelector("#inspector-tool-select");
  const toolDescription = root.querySelector("#inspector-tool-description");
  const toolSchema = root.querySelector("#inspector-tool-schema");
  const toolInput = root.querySelector("#inspector-tool-input");
  const toolResult = root.querySelector("#inspector-tool-result");
  const invokeButton = root.querySelector("#inspector-invoke-button");
  const cancelButton = root.querySelector("#inspector-cancel-button");
  const operations = root.querySelector("#inspector-operations");
  const log = root.querySelector("#inspector-log");
  let activeTab = "overview";
  let activeAbortController = null;
  let renderSignature = null;

  toolSelect.replaceChildren(...tools.map((tool) => {
    const option = document.createElement("option");
    option.value = tool.name;
    option.textContent = `${tool.title ?? tool.name} (${tool.name})`;
    return option;
  }));

  function selectedTool() {
    return tools.find((tool) => tool.name === toolSelect.value);
  }

  function renderTool() {
    const tool = selectedTool();
    if (!tool) return;
    toolDescription.textContent = tool.description;
    toolSchema.textContent = formatted(tool.inputSchema ?? {});
    toolInput.value = formatted(sampleInput(tool));
  }

  function selectTab(tabName) {
    activeTab = tabName;
    for (const button of tabButtons) {
      button.setAttribute("aria-selected", String(button.dataset.inspectorTab === tabName));
    }
    for (const panel of panels) panel.hidden = panel.dataset.inspectorPanel !== tabName;
    refresh(true);
  }

  function refresh(force = false) {
    if (root.hidden) return;
    const state = controller.getSnapshot();
    const nextSignature = `${activeTab}:${state.tick}:${state.history.length}:${invocationLog.length}:${invocationLog.at(-1)?.status ?? ""}`;
    if (!force && nextSignature === renderSignature) return;
    renderSignature = nextSignature;

    if (activeTab === "overview") {
      const robot = state.world.entities.robot;
      overview.textContent = formatted({
        webMcp: webMcpSupported ? "registered" : "unsupported (local controls available)",
        tick: state.tick,
        day: state.day,
        money: state.money,
        robot: {
          position: robot.position,
          facing: robot.facing,
          stamina: robot.stamina,
          sleeping: robot.sleeping,
          selectedSlot: robot.selectedSlot,
          inventory: robot.inventory,
          activeIntent: robot.activeIntent,
        },
      });
    } else if (activeTab === "operations") {
      operations.textContent = formatted(Object.values(state.operations));
    } else if (activeTab === "log") {
      log.textContent = formatted({
        toolInvocations: invocationLog.slice(-25),
        gameEvents: state.history.slice(-50),
      });
    }
  }

  for (const button of tabButtons) {
    button.addEventListener("click", () => selectTab(button.dataset.inspectorTab));
  }
  toolSelect.addEventListener("change", renderTool);

  invokeButton.addEventListener("click", async () => {
    const tool = selectedTool();
    if (!tool || activeAbortController) return;
    let input;
    try {
      input = JSON.parse(toolInput.value);
    } catch (error) {
      toolResult.textContent = `Invalid JSON: ${error.message}`;
      return;
    }

    activeAbortController = new AbortController();
    cancelButton.disabled = false;
    invokeButton.disabled = true;
    toolResult.textContent = "Running...";
    try {
      toolResult.textContent = formatted(await tool.execute(
        input,
        { signal: activeAbortController.signal },
      ));
    } catch (error) {
      toolResult.textContent = formatted({ success: false, error: error.message });
    } finally {
      activeAbortController = null;
      cancelButton.disabled = true;
      invokeButton.disabled = false;
      refresh(true);
    }
  });

  cancelButton.addEventListener("click", () => activeAbortController?.abort());
  renderTool();
  selectTab("overview");

  return {
    open() {
      root.hidden = false;
      refresh(true);
    },
    refresh,
  };
}