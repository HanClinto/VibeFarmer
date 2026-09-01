import { renderCollapsibleLog } from "./collapsible-log.js";
import { renderJson } from "./json-view.js";
import { renderGame } from "./renderer.js";

function formatted(value) {
  return JSON.stringify(value, null, 2);
}

function mapLabel(mapId) {
  return mapId === "farmhouse" ? "Farmhouse" : mapId === "farm" ? "Farm" : mapId;
}

function sampleInput(tool) {
  const samples = {
    inspect_game: { mode: "compact", radius: 6, includeHistory: false },
    inspect_market: {},
    find_entities: { entityType: "plant", watered: false, maxResults: 5 },
    move_to: { x: 12, y: 12 },
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

export function nextTabIndex(key, currentIndex, tabCount) {
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  if (key === "ArrowRight") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft") return (currentIndex - 1 + tabCount) % tabCount;
  return currentIndex;
}

export function operationSummary(operation, currentTick) {
  const elapsedTicks = (operation.completedTick ?? currentTick) - operation.submittedTick;
  return `${operation.operationId} · ${operation.actorId} · ${operation.command.type}`
    + ` · ${operation.status} · ${elapsedTicks} ticks`;
}

export function robotOverview(state) {
  const robot = state.world.entities.robot;
  const operation = robot.activeIntent ? state.operations[robot.activeIntent] : null;
  return {
    status: operation
      ? `${operation.status} · ${operation.command.type} · ${operation.phase}`
      : robot.sleeping ? "Sleeping" : "Idle",
    location: `(${robot.position.x}, ${robot.position.y})`,
    stamina: `${robot.stamina}`,
    selectedSlot: robot.selectedSlot,
    inventory: robot.inventory.map((stack, index) => ({
      slot: index + 1,
      itemId: stack?.itemId ?? null,
      quantity: stack?.quantity ?? 0,
      selected: robot.selectedSlot === index + 1,
    })),
    raw: robot,
  };
}

export function createInspector({
  root,
  controller,
  tools,
  invocationLog,
  webMcpSupported,
  sprites,
  getTickProgress = () => 1,
  inspectRobot,
}) {
  const tabButtons = [...root.querySelectorAll("button[data-inspector-tab]")];
  const panels = [...root.querySelectorAll("[data-inspector-panel]")];
  const overview = root.querySelector("#inspector-overview");
  const robotSummary = root.querySelector("#inspector-robot-summary");
  const robotInventory = root.querySelector("#inspector-robot-inventory");
  const robotCamera = root.querySelector("#inspector-robot-camera");
  const robotAgentView = root.querySelector("#inspector-robot-agent-view");
  const robotViewStatus = root.querySelector("#inspector-robot-view-status");
  const robotViewButtons = [...root.querySelectorAll("button[data-robot-view]")];
  const toolSelect = root.querySelector("#inspector-tool-select");
  const toolDescription = root.querySelector("#inspector-tool-description");
  const toolSchema = root.querySelector("#inspector-tool-schema");
  const toolInput = root.querySelector("#inspector-tool-input");
  const toolResult = root.querySelector("#inspector-tool-result");
  const invokeButton = root.querySelector("#inspector-invoke-button");
  const cancelButton = root.querySelector("#inspector-cancel-button");
  const operations = root.querySelector("#inspector-operations");
  const operationsEmpty = root.querySelector("#inspector-operations-empty");
  const log = root.querySelector("#inspector-log");
  let activeTab = "overview";
  let activeAbortController = null;
  let renderSignature = null;
  let robotViewMode = "camera";

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
    renderJson(toolSchema, tool.inputSchema ?? {});
    toolInput.value = formatted(sampleInput(tool));
  }

  function selectTab(tabName) {
    activeTab = tabName;
    for (const button of tabButtons) {
      const selected = button.dataset.inspectorTab === tabName;
      button.setAttribute("aria-selected", String(selected));
      button.tabIndex = selected ? 0 : -1;
    }
    for (const panel of panels) panel.hidden = panel.dataset.inspectorPanel !== tabName;
    refresh(true);
  }

  function selectRobotView(mode) {
    robotViewMode = mode;
    robotCamera.hidden = mode !== "camera";
    robotAgentView.hidden = mode !== "agent";
    for (const button of robotViewButtons) {
      button.setAttribute("aria-pressed", String(button.dataset.robotView === mode));
    }
    refresh(true);
  }

  function renderRobotView(state) {
    const robot = state.world.entities.robot;
    if (robotViewMode === "camera") {
      renderGame(robotCamera.getContext("2d"), state, {
        tickProgress: getTickProgress(),
        sprites,
        focusActorId: "robot",
      });
      robotViewStatus.textContent = `${mapLabel(robot.mapId)} · (${robot.position.x}, ${robot.position.y})`;
      return;
    }
    const observation = inspectRobot();
    robotAgentView.textContent = observation.view.ascii;
    robotViewStatus.textContent = `${mapLabel(observation.map.id)} · radius ${observation.view.radius}`;
  }

  function refresh(force = false) {
    if (root.hidden) return;
    const state = controller.getSnapshot();
    if (activeTab === "overview" && robotViewMode === "camera") renderRobotView(state);
    const nextSignature = activeTab === "log"
      ? `log:${invocationLog.length}:${invocationLog.at(-1)?.status ?? ""}`
      : `${activeTab}:${state.tick}:${state.history.length}`;
    if (!force && nextSignature === renderSignature) return;
    renderSignature = nextSignature;

    if (activeTab === "overview") {
      const view = robotOverview(state);
      if (robotViewMode === "agent") renderRobotView(state);
      const summaryFields = [
        ["Status", view.status],
        ["Location", view.location],
        ["Stamina", view.stamina],
        ["Equipped slot", String(view.selectedSlot)],
      ];
      robotSummary.replaceChildren(...summaryFields.flatMap(([termText, valueText]) => {
        const term = document.createElement("dt");
        term.textContent = termText;
        const value = document.createElement("dd");
        value.textContent = valueText;
        return [term, value];
      }));
      robotInventory.replaceChildren(...view.inventory.map((slot) => {
        const item = document.createElement("div");
        item.className = "robot-inventory-slot";
        item.setAttribute("role", "listitem");
        item.dataset.selected = String(slot.selected);
        item.setAttribute("aria-label", slot.itemId
          ? `Slot ${slot.slot}: ${slot.itemId}, quantity ${slot.quantity}`
          : `Slot ${slot.slot}: Empty`);
        const key = document.createElement("span");
        key.className = "slot-key";
        key.textContent = String(slot.slot);
        const iconFrame = slot.itemId ? sprites.frames[`item.${slot.itemId}`] : null;
        if (iconFrame) {
          const icon = document.createElement("img");
          icon.className = "slot-icon";
          icon.src = iconFrame.url;
          icon.alt = "";
          item.append(icon);
        }
        const label = document.createElement("span");
        label.className = "slot-item";
        label.textContent = slot.itemId
          ? `${slot.quantity > 1 ? `×${slot.quantity}` : ""}`
          : "Empty";
        item.append(key, label);
        return item;
      }));
      renderJson(overview, {
        webMcp: webMcpSupported ? "registered" : "unsupported (local controls available)",
        tick: state.tick,
        day: state.day,
        money: state.money,
        robot: view.raw,
      });
    } else if (activeTab === "operations") {
      const records = Object.values(state.operations).reverse();
      operationsEmpty.hidden = records.length > 0;
      renderCollapsibleLog(operations, records, {
        getId: (operation) => operation.operationId,
        getSummary: (operation) => operationSummary(operation, state.tick),
      });
    } else if (activeTab === "log") {
      renderCollapsibleLog(log, invocationLog.slice(-25).reverse(), {
        getId: (invocation) => invocation.invocationId,
        getSummary: (invocation) => (
          `${invocation.invocationId} · ${invocation.toolName} · ${invocation.status}`
            + (invocation.durationMs === undefined ? "" : ` · ${invocation.durationMs}ms`)
        ),
      });
    }
  }

  for (const button of tabButtons) {
    button.addEventListener("click", () => selectTab(button.dataset.inspectorTab));
    button.addEventListener("keydown", (event) => {
      const currentIndex = tabButtons.indexOf(button);
      const targetIndex = nextTabIndex(event.key, currentIndex, tabButtons.length);
      if (targetIndex === currentIndex) return;
      event.preventDefault();
      const target = tabButtons[targetIndex];
      selectTab(target.dataset.inspectorTab);
      target.focus();
    });
  }
  for (const button of robotViewButtons) {
    button.addEventListener("click", () => selectRobotView(button.dataset.robotView));
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
      renderJson(toolResult, await tool.execute(
        input,
        { signal: activeAbortController.signal },
      ));
    } catch (error) {
      renderJson(toolResult, { success: false, error: error.message });
    } finally {
      activeAbortController = null;
      cancelButton.disabled = true;
      invokeButton.disabled = false;
      refresh(true);
    }
  });

  cancelButton.addEventListener("click", () => activeAbortController?.abort());
  renderTool();
  selectRobotView("camera");
  selectTab("overview");

  return {
    open() {
      root.hidden = false;
      refresh(true);
    },
    refresh,
  };
}