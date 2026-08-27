import { createController } from "../../application/controller.js";
import {
  GAME_CONFIG,
  ITEM_TYPES,
  createFarmState,
  inspectLocation,
} from "../../game/index.js";
import { renderGame } from "./renderer.js";
import { createRuntime } from "./runtime.js";
import { loadSpriteCatalog } from "./sprite-catalog.js";
import { createActionLog } from "./action-log.js";
import { makeWindowDraggable } from "./draggable-windows.js";
import { createWindowManager, isEditingText } from "./window-manager.js";
import { createInspector } from "./inspector.js";
import { commandForGameplayKey } from "./keyboard-controls.js";
import { createObjectInspector } from "./object-inspector.js";
import { createPersistence } from "./persistence.js";
import { registerWebMcp } from "../webmcp/adapter.js";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const hotbar = document.querySelector("#hotbar");
const staminaValue = document.querySelector("#stamina-value");
const intentStatus = document.querySelector("#intent-status");
const tickValue = document.querySelector("#tick-value");
const dayValue = document.querySelector("#day-value");
const moneyValue = document.querySelector("#money-value");
const marketWindow = document.querySelector("#market-window");
const marketStatus = document.querySelector("#market-status");
const storageWindow = document.querySelector("#storage-window");
const storageTarget = document.querySelector("#storage-target");
const storagePlayerItems = document.querySelector("#storage-player-items");
const storageTargetItems = document.querySelector("#storage-target-items");
const storageStatus = document.querySelector("#storage-status");
const inspectorWindow = document.querySelector("#inspector-window");
const actionLogWindow = document.querySelector("#action-log-window");
const objectInspectorWindow = document.querySelector("#object-inspector-window");
const windowManager = createWindowManager();
const sprites = await loadSpriteCatalog();

makeWindowDraggable(marketWindow);
makeWindowDraggable(storageWindow);
makeWindowDraggable(inspectorWindow);
makeWindowDraggable(actionLogWindow);
makeWindowDraggable(objectInspectorWindow);

const persistence = createPersistence(window.localStorage);
const restoredSave = persistence.load();
const controller = createController(restoredSave.state ?? createFarmState());
const actionLog = createActionLog({ root: actionLogWindow, controller });
const objectInspector = createObjectInspector({
  root: objectInspectorWindow,
  controller,
  inspect: inspectLocation,
  openRobotInspector() {
    inspectorDialog.open();
  },
});
const marketDialog = windowManager.register({
  windowElement: marketWindow,
  launcher: document.querySelector("#market-button"),
  closeButton: document.querySelector("#market-close-button"),
});
const storageDialog = windowManager.register({
  windowElement: storageWindow,
  launcher: document.querySelector("#storage-button"),
  closeButton: document.querySelector("#storage-close-button"),
  onOpen() {
    storageSignature = null;
    updateStorageWindow(controller.getSnapshot());
    refresh();
  },
  onClose: () => refresh(),
});
const inspectorDialog = windowManager.register({
  windowElement: inspectorWindow,
  launcher: document.querySelector("#inspector-button"),
  closeButton: document.querySelector("#inspector-close-button"),
  onOpen: () => inspector?.open(),
});
const actionLogDialog = windowManager.register({
  windowElement: actionLogWindow,
  launcher: document.querySelector("#action-log-button"),
  closeButton: document.querySelector("#action-log-close-button"),
  onOpen: () => actionLog.open(),
});
const objectInspectorDialog = windowManager.register({
  windowElement: objectInspectorWindow,
  launcher: canvas,
  closeButton: document.querySelector("#object-inspector-close-button"),
  onOpen: () => objectInspector.refresh(),
});
const initialStatusMessages = {
  NO_SAVE: "Ready",
  SAVE_RESTORED: "Save restored",
  SAVE_RESTORED_WITH_INTERRUPTED_OPERATION: "Save restored; active work was cancelled",
  SAVE_CORRUPT: "Invalid save removed; new game started",
};
let statusMessage = initialStatusMessages[restoredSave.code];
let tickProgress = 1;
let hotbarSignature = null;
let storageSignature = null;
let inspector = null;
const invocationLog = [];
const runtime = createRuntime(controller, {
  onFrame: (_state, nextTickProgress) => {
    tickProgress = nextTickProgress;
    refresh();
  },
});

controller.subscribe(({ state }) => persistence.scheduleSave(state));
window.addEventListener("beforeunload", () => persistence.flush(controller.getSnapshot()));
persistence.scheduleSave(controller.getSnapshot());
registerWebMcp(document.modelContext, controller, {
  onInvocation(record) {
    const index = invocationLog.findIndex(
      (existing) => existing.invocationId === record.invocationId,
    );
    if (index === -1) invocationLog.push(record);
    else invocationLog[index] = record;
    inspector?.refresh(true);
  },
}).then(({ supported, tools }) => {
  document.querySelector("#robot-demo-button").title = supported
    ? "WebMCP tools registered"
    : "WebMCP unavailable; this button uses the same controller locally";
  inspector = createInspector({
    root: inspectorWindow,
    controller,
    tools,
    invocationLog,
    webMcpSupported: supported,
    sprites,
  });
});

function updateHotbar(state) {
  const player = state.world.entities.player;
  const nextSignature = JSON.stringify({
    selectedSlot: player.selectedSlot,
    inventory: player.inventory,
  });
  if (nextSignature === hotbarSignature) return;
  hotbarSignature = nextSignature;

  hotbar.replaceChildren(...player.inventory.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.slot = String(index + 1);
    button.setAttribute("aria-pressed", String(player.selectedSlot === index + 1));
    button.title = item ? `Slot ${index + 1}: ${item.itemId}` : `Slot ${index + 1}: Empty`;

    const key = document.createElement("span");
    key.className = "slot-key";
    key.textContent = index === 9 ? "0" : String(index + 1);
    const iconFrame = item ? sprites.frames[`item.${item.itemId}`] : null;
    if (iconFrame) {
      const icon = document.createElement("img");
      icon.className = "slot-icon";
      icon.src = iconFrame.url;
      icon.alt = "";
      button.append(icon);
    }
    const label = document.createElement("span");
    label.className = "slot-item";
    label.textContent = item?.quantity > 1 ? `×${item.quantity}` : "";
    button.append(key, label);
    return button;
  }));
}

function adjacentContainers(state) {
  const player = state.world.entities.player;
  return Object.values(state.world.entities)
    .filter((entity) => entity.id !== player.id && entity.inventory)
    .filter((entity) => Math.abs(entity.position.x - player.position.x)
      + Math.abs(entity.position.y - player.position.y) === 1)
    .sort((first, second) => first.id.localeCompare(second.id));
}

function itemButton(stack, direction) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.storageDirection = direction;
  button.dataset.itemId = stack.itemId;
  button.textContent = `${direction === "deposit" ? "Deposit" : "Withdraw"} ${ITEM_TYPES[stack.itemId]?.name ?? stack.itemId} ×${stack.quantity}`;
  return button;
}

function updateStorageWindow(state) {
  if (storageWindow.hidden) return;
  const containers = adjacentContainers(state);
  const currentTargetId = storageTarget.value;
  const selectedTarget = containers.find((entity) => entity.id === currentTargetId)
    ?? containers[0]
    ?? null;
  const nextSignature = JSON.stringify({
    player: state.world.entities.player.inventory,
    containers: containers.map((entity) => ({ id: entity.id, inventory: entity.inventory })),
    selectedTargetId: selectedTarget?.id ?? null,
  });
  if (nextSignature === storageSignature) return;
  storageSignature = nextSignature;

  storageTarget.replaceChildren(...containers.map((entity) => {
    const option = document.createElement("option");
    option.value = entity.id;
    option.textContent = entity.type === "chest" ? "Farm Chest" : "Robot";
    option.selected = entity.id === selectedTarget?.id;
    return option;
  }));
  storagePlayerItems.replaceChildren(
    ...state.world.entities.player.inventory.filter(Boolean)
      .map((stack) => itemButton(stack, "deposit")),
  );
  storageTargetItems.replaceChildren(
    ...(selectedTarget?.inventory.filter(Boolean) ?? [])
      .map((stack) => itemButton(stack, "withdraw")),
  );
  if (!selectedTarget) storageStatus.textContent = "No adjacent storage";
}

function refresh(message) {
  if (message) statusMessage = message;
  const state = controller.getSnapshot();
  const openEntityIds = new Set(
    storageWindow.hidden || !storageTarget.value ? [] : [storageTarget.value],
  );
  renderGame(context, state, { tickProgress, sprites, openEntityIds });
  updateHotbar(state);
  staminaValue.textContent = `${state.world.entities.player.stamina}/${GAME_CONFIG.maxStamina}`;
  dayValue.textContent = String(state.day);
  moneyValue.textContent = `${state.money}g`;
  intentStatus.textContent = statusMessage;
  tickValue.textContent = String(state.tick);
  updateStorageWindow(state);
  inspector?.refresh();
  actionLog.refresh();
  objectInspector.refresh();
}

function runImmediate(command) {
  const result = controller.execute({ source: "human-ui", ...command });
  refresh(result.success ? result.code : `Cannot act: ${result.code}`);
}

function submit(command) {
  const submission = controller.submit({ source: "human-ui", ...command });
  if (!submission.success) {
    refresh(`Cannot act: ${submission.code}`);
    return;
  }
  refresh(`Running ${submission.operationId}`);
  submission.completion.then((result) => {
    refresh(result.success ? result.code : `Stopped: ${result.code}`);
  });
}

function canvasPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  const state = controller.getSnapshot();
  return {
    x: Math.floor((event.clientX - bounds.left) / (bounds.width / state.world.width)),
    y: Math.floor((event.clientY - bounds.top) / (bounds.height / state.world.height)),
  };
}

canvas.addEventListener("click", (event) => {
  const target = canvasPosition(event);
  const occupied = Object.values(controller.getSnapshot().world.entities).some(
    (entity) => entity.position?.x === target.x && entity.position?.y === target.y,
  );
  if (!event.shiftKey && occupied) {
    objectInspector.select(target);
    objectInspectorDialog.open();
    return;
  }
  const player = controller.getSnapshot().world.entities.player;
  const selectedItem = player.inventory[player.selectedSlot - 1];
  submit({
    type: event.shiftKey ? "interact_at" : "move_to",
    actorId: "player",
    target,
    item: event.shiftKey && selectedItem === null ? { action: "harvest" } : undefined,
  });
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  objectInspector.select(canvasPosition(event));
  objectInspectorDialog.open();
});

hotbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-slot]");
  if (!button) return;
  runImmediate({ type: "select_slot", actorId: "player", slot: Number(button.dataset.slot) });
});

window.addEventListener("keydown", (event) => {
  if (isEditingText(event.target) || document.querySelector('[role="dialog"]:not([hidden])')) return;
  if (/^[0-9]$/.test(event.key)) {
    runImmediate({
      type: "select_slot",
      actorId: "player",
      slot: event.key === "0" ? 10 : Number(event.key),
    });
    return;
  }

  const player = controller.getSnapshot().world.entities.player;
  const command = commandForGameplayKey(event.key, player);
  if (!command) return;
  event.preventDefault();
  submit(command);
});

document.querySelector("#new-game-button").addEventListener("click", () => {
  if (!window.confirm("Start a new game? This will replace the current autosave.")) return;
  persistence.clear();
  hotbarSignature = null;
  storageSignature = null;
  controller.replaceState(createFarmState());
  refresh("New game started");
});

document.querySelector("#robot-demo-button").addEventListener("click", () => {
  const target = Object.values(controller.getSnapshot().world.entities)
    .find((object) => object.type === "tree");
  if (!target) {
    refresh("No trees remain");
    return;
  }
  submit({
    type: "interact_at",
    actorId: "robot",
    target: { ...target.position },
    item: { itemId: "axe" },
  });
});

document.querySelector("#sleep-button").addEventListener("click", () => {
  runImmediate({ type: "sleep_actor", actorId: "player" });
});

for (const button of document.querySelectorAll("button[data-market-action]")) {
  const itemType = ITEM_TYPES[button.dataset.itemId];
  const action = button.dataset.marketAction;
  const price = action === "buy" ? itemType.buyPrice : itemType.sellPrice;
  button.textContent = `${action === "buy" ? "Buy" : "Sell"} ${itemType.name} · ${price}g`;
}

document.querySelector("#market-button").addEventListener("click", () => {
  storageDialog.close();
  marketDialog.open();
});

marketWindow.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-market-action]");
  if (!button) return;
  const result = controller.execute({
    source: "human-ui",
    type: `${button.dataset.marketAction}_item`,
    actorId: "player",
    itemId: button.dataset.itemId,
    quantity: 1,
  });
  marketStatus.textContent = result.code;
  refresh(result.success ? result.code : `Cannot trade: ${result.code}`);
});

document.querySelector("#storage-button").addEventListener("click", () => {
  marketDialog.close();
  storageDialog.open();
});

document.querySelector("#inspector-button").addEventListener("click", () => {
  inspectorDialog.open();
});

document.querySelector("#action-log-button").addEventListener("click", () => {
  actionLogDialog.open();
});

storageTarget.addEventListener("change", () => {
  storageSignature = null;
  updateStorageWindow(controller.getSnapshot());
});

storageWindow.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-storage-direction]");
  if (!button || !storageTarget.value) return;
  const deposit = button.dataset.storageDirection === "deposit";
  const result = controller.execute({
    source: "human-ui",
    type: "transfer_item",
    actorId: "player",
    fromEntityId: deposit ? "player" : storageTarget.value,
    toEntityId: deposit ? storageTarget.value : "player",
    itemId: button.dataset.itemId,
    quantity: 1,
  });
  storageStatus.textContent = result.code;
  storageSignature = null;
  refresh(result.success ? result.code : `Cannot transfer: ${result.code}`);
});

document.querySelector(".speed-controls").addEventListener("click", (event) => {
  const button = event.target.closest("button[data-speed]");
  if (!button) return;
  const speed = Number(button.dataset.speed);
  runtime.setSpeed(speed);
  for (const speedButton of document.querySelectorAll("button[data-speed]")) {
    speedButton.setAttribute("aria-pressed", String(speedButton === button));
  }
  refresh(speed === 0 ? "Simulation paused" : `Simulation speed ${speed}x`);
});

document.querySelector("#help-button").addEventListener("click", () => {
  window.alert("Left-click to walk. Use Arrow keys or WASD to step. Shift-click a target, or press Space/E to use the selected item on the faced tile. Keys 1-0 select inventory slots.");
});

refresh();
runtime.start();