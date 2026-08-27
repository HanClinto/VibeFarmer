import { createController } from "../../application/controller.js";
import {
  GAME_CONFIG,
  CROP_TYPES,
  ITEM_TYPES,
  createFarmState,
  inspectLocation,
} from "../../game/index.js";
import { RENDER_TILE_SIZE, renderGame } from "./renderer.js";
import { createRuntime } from "./runtime.js";
import { screenToWorld } from "./camera.js";
import { loadSpriteCatalog } from "./sprite-catalog.js";
import { createActionLog } from "./action-log.js";
import { makeWindowDraggable } from "./draggable-windows.js";
import { createWindowManager, isEditingText } from "./window-manager.js";
import { createInspector } from "./inspector.js";
import {
  commandForGameplayKey,
  createHeldMovementController,
  isMovementKey,
} from "./keyboard-controls.js";
import { createObjectInspector } from "./object-inspector.js";
import { createPersistence } from "./persistence.js";
import { renderDaySummary } from "./day-summary.js";
import { createSceneTransition } from "./scene-transition.js";
import { contextualActions } from "./contextual-actions.js";
import { actionForCanvasClick } from "./pointer-controls.js";
import { marketListings } from "./market.js";
import { createGameAudio } from "./audio.js";
import { registerWebMcp } from "../webmcp/adapter.js";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const hotbar = document.querySelector("#hotbar");
const contextualActionsRoot = document.querySelector("#contextual-actions");
const staminaValue = document.querySelector("#stamina-value");
const robotStatusValue = document.querySelector("#robot-status-value");
const intentStatus = document.querySelector("#intent-status");
const tickValue = document.querySelector("#tick-value");
const dayValue = document.querySelector("#day-value");
const moneyValue = document.querySelector("#money-value");
const marketWindow = document.querySelector("#market-window");
const marketStatus = document.querySelector("#market-status");
const marketMoneyValue = document.querySelector("#market-money-value");
const marketCoinIcon = document.querySelector("#market-coin-icon");
const marketBuyItems = document.querySelector("#market-buy-items");
const marketSellItems = document.querySelector("#market-sell-items");
const storageWindow = document.querySelector("#storage-window");
const storageTargetName = document.querySelector("#storage-target-name");
const storagePlayerItems = document.querySelector("#storage-player-items");
const storageTargetItems = document.querySelector("#storage-target-items");
const storageStatus = document.querySelector("#storage-status");
const inspectorWindow = document.querySelector("#inspector-window");
const actionLogWindow = document.querySelector("#action-log-window");
const objectInspectorWindow = document.querySelector("#object-inspector-window");
const daySummaryWindow = document.querySelector("#day-summary-window");
const sceneTransition = createSceneTransition(document.querySelector("#scene-transition"));
const windowManager = createWindowManager();
const sprites = await loadSpriteCatalog();
const gameAudio = createGameAudio();

function marketButton(item, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.dataset.marketAction = action;
  button.dataset.itemId = item.id;
  return button;
}

const listings = marketListings(ITEM_TYPES);
marketBuyItems.replaceChildren(...listings.buy.map((item) => marketButton(item, "buy")));
marketSellItems.replaceChildren(...listings.sell.map((item) => marketButton(item, "sell")));

makeWindowDraggable(marketWindow);
makeWindowDraggable(storageWindow);
makeWindowDraggable(inspectorWindow);
makeWindowDraggable(actionLogWindow);
makeWindowDraggable(objectInspectorWindow);
makeWindowDraggable(daySummaryWindow);

const persistence = createPersistence(window.localStorage);
const restoredSave = persistence.load();
const controller = createController(restoredSave.state ?? createFarmState());
let activeStorageTargetId = null;
let contextualActionsSignature = null;
const actionLog = createActionLog({ root: actionLogWindow, controller });

function openStorage(entityId) {
  activeStorageTargetId = entityId;
  objectInspectorDialog.close();
  marketDialog.close();
  storageDialog.open();
}

function openMarket() {
  objectInspectorDialog.close();
  storageDialog.close();
  marketDialog.open();
}

function sleepPlayer() {
  objectInspectorDialog.close();
  runImmediate({ type: "sleep_actor", actorId: "player" });
}

const objectInspector = createObjectInspector({
  root: objectInspectorWindow,
  controller,
  inspect: inspectLocation,
  openRobotInspector() {
    inspectorDialog.open();
  },
  openStorage,
  openMarket,
  sleepAtBed: sleepPlayer,
});
const marketDialog = windowManager.register({
  windowElement: marketWindow,
  launcher: document.querySelector("#object-inspector-market-button"),
  closeButton: document.querySelector("#market-close-button"),
  onOpen: () => updateMarketWindow(controller.getSnapshot()),
});
const storageDialog = windowManager.register({
  windowElement: storageWindow,
  launcher: document.querySelector("#object-inspector-storage-button"),
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
const daySummaryDialog = windowManager.register({
  windowElement: daySummaryWindow,
  launcher: document.querySelector("#object-inspector-sleep-button"),
  closeButton: document.querySelector("#day-summary-close-button"),
  onClose: () => {
    sceneTransition.wake().then(() => canvas.focus({ preventScroll: true }));
  },
});
const initialStatusMessages = {
  NO_SAVE: "Ready",
  SAVE_RESTORED: "Save restored",
  SAVE_RESTORED_WITH_INTERRUPTED_OPERATION: "Save restored; active work was cancelled",
  SAVE_OUTDATED: "Old development save reset for this build",
  SAVE_UNSUPPORTED: "Save was created by a newer version",
  SAVE_CORRUPT: "Invalid save removed; new game started",
};
let statusMessage = initialStatusMessages[restoredSave.code];
let tickProgress = 1;
let camera = { x: 0, y: 0 };
let hotbarSignature = null;
let storageSignature = null;
let inspector = null;
let observedPlayerMapId = controller.getSnapshot().world.entities.player.mapId;
let hoverTarget = null;
let observedHistoryEvent = controller.getSnapshot().history.at(-1) ?? null;
const invocationLog = [];
const runtime = createRuntime(controller, {
  onFrame: (_state, nextTickProgress) => {
    tickProgress = nextTickProgress;
    refresh();
  },
});

controller.subscribe(async ({ state, result }) => {
  persistence.scheduleSave(state);
  const previousEventIndex = observedHistoryEvent ? state.history.indexOf(observedHistoryEvent) : -1;
  const newEvents = state.history.slice(previousEventIndex + 1);
  for (const event of newEvents) gameAudio.playEvent(event);
  observedHistoryEvent = state.history.at(-1) ?? null;
  const nextMapId = state.world.entities.player.mapId;
  if (nextMapId !== observedPlayerMapId) {
    observedPlayerMapId = nextMapId;
    const mapName = nextMapId === "farmhouse" ? "Farmhouse" : "Farm";
    sceneTransition.playMapChange(mapName);
  }
  if (result.code === "DAY_ADVANCED") {
    heldMovement.clear();
    await sceneTransition.beginNight();
    renderDaySummary(daySummaryWindow, result.summary);
    daySummaryDialog.open();
  }
});
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
    .filter((entity) => entity.id !== player.id
      && entity.mapId === player.mapId
      && entity.inventory)
    .filter((entity) => Math.abs(entity.position.x - player.position.x)
      + Math.abs(entity.position.y - player.position.y) === 1)
    .sort((first, second) => first.id.localeCompare(second.id));
}

function itemButton(stack, direction) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "item-action-button";
  button.dataset.storageDirection = direction;
  button.dataset.itemId = stack.itemId;
  button.dataset.quantity = String(stack.quantity);
  const iconFrame = sprites.frames[`item.${stack.itemId}`];
  if (iconFrame) {
    const icon = document.createElement("img");
    icon.className = "item-action-icon";
    icon.src = iconFrame.url;
    icon.alt = "";
    button.append(icon);
  }
  const copy = document.createElement("span");
  copy.className = "item-action-copy";
  copy.textContent = `${direction === "deposit" ? "Deposit" : "Withdraw"}\n${ITEM_TYPES[stack.itemId]?.name ?? stack.itemId}`;
  const quantity = document.createElement("strong");
  quantity.className = "item-action-quantity";
  quantity.textContent = `×${stack.quantity}`;
  button.append(copy, quantity);
  return button;
}

function itemQuantity(inventory, itemId) {
  return inventory.reduce(
    (total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0),
    0,
  );
}

function updateMarketWindow(state) {
  if (marketWindow.hidden) return;
  const inventory = state.world.entities.player.inventory;
  const coinFrame = sprites.frames["item.coin"];
  marketMoneyValue.textContent = `${state.money}g`;
  if (coinFrame) marketCoinIcon.src = coinFrame.url;
  for (const button of document.querySelectorAll("button[data-market-action]")) {
    const itemId = button.dataset.itemId;
    const itemType = ITEM_TYPES[itemId];
    const action = button.dataset.marketAction;
    const price = action === "buy" ? itemType.buyPrice : itemType.sellPrice;
    const owned = itemQuantity(inventory, itemId);
    button.disabled = action === "buy" ? state.money < price : owned === 0;
    button.classList.add("market-item-row");
    const iconFrame = sprites.frames[`item.${itemId}`];
    const children = [];
    if (iconFrame) {
      const icon = document.createElement("img");
      icon.className = "item-action-icon";
      icon.src = iconFrame.url;
      icon.alt = "";
      children.push(icon);
    }
    const copy = document.createElement("span");
    copy.className = "market-item-copy";
    const name = document.createElement("strong");
    name.textContent = itemType.name;
    const ownedText = document.createElement("small");
    ownedText.textContent = `Owned: ${owned}`;
    copy.append(name);
    if (itemType.category === "seed") {
      const crop = CROP_TYPES[itemType.cropType];
      const cropDetails = document.createElement("small");
      const yieldText = crop.yield.minimum === crop.yield.maximum
        ? `${crop.yield.minimum} yield`
        : `${crop.yield.minimum}-${crop.yield.maximum} yield`;
      cropDetails.textContent = crop.regrowDays
        ? `${crop.matureStage} nights · ${yieldText} · regrows in ${crop.regrowDays}`
        : `${crop.matureStage} nights · ${yieldText}`;
      copy.append(cropDetails);
    }
    copy.append(ownedText);
    const trade = document.createElement("span");
    trade.className = "market-trade";
    const priceLine = document.createElement("span");
    priceLine.className = "market-price";
    if (coinFrame) {
      const coin = document.createElement("img");
      coin.src = coinFrame.url;
      coin.alt = "";
      priceLine.append(coin);
    }
    const priceText = document.createElement("strong");
    priceText.textContent = String(price);
    priceLine.append(priceText);
    const actionText = document.createElement("span");
    actionText.className = "market-action-label";
    actionText.textContent = action === "buy" ? "Buy" : "Sell";
    trade.append(priceLine, actionText);
    children.push(copy, trade);
    button.replaceChildren(...children);
    button.title = `${itemType.name}: ${price}g; player owns ${owned}`;
  }
}

function updateStorageWindow(state) {
  if (storageWindow.hidden) return;
  const containers = adjacentContainers(state);
  const selectedTarget = containers.find((entity) => entity.id === activeStorageTargetId) ?? null;
  const nextSignature = JSON.stringify({
    player: state.world.entities.player.inventory,
    containers: containers.map((entity) => ({ id: entity.id, inventory: entity.inventory })),
    selectedTargetId: selectedTarget?.id ?? null,
  });
  if (nextSignature === storageSignature) return;
  storageSignature = nextSignature;

  storageTargetName.textContent = selectedTarget
    ? selectedTarget.type === "chest" ? "Farm Chest" : "Robot Farmhand"
    : "Out of reach";
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

function updateContextualActions(state) {
  const actions = contextualActions(state, inspectLocation);
  const nextSignature = JSON.stringify(actions);
  if (nextSignature === contextualActionsSignature) return;
  contextualActionsSignature = nextSignature;
  contextualActionsRoot.hidden = actions.length === 0;
  contextualActionsRoot.replaceChildren(...actions.map((action) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.contextAction = action.type;
    button.dataset.entityId = action.entityId;
    button.textContent = action.label;
    return button;
  }));
}

function refresh(message) {
  if (message) statusMessage = message;
  const state = controller.getSnapshot();
  const openEntityIds = new Set(
    storageWindow.hidden || !activeStorageTargetId ? [] : [activeStorageTargetId],
  );
  camera = renderGame(context, state, {
    tickProgress,
    sprites,
    openEntityIds,
    hoverTarget,
  });
  updateHotbar(state);
  staminaValue.textContent = `${state.world.entities.player.stamina}/${GAME_CONFIG.maxStamina}`;
  const robot = state.world.entities.robot;
  const robotState = robot.activeIntent ? "Working" : robot.sleeping ? "Resting" : "Ready";
  robotStatusValue.textContent = `${robot.stamina}/${GAME_CONFIG.maxStamina} · ${robotState}`;
  dayValue.textContent = String(state.day);
  moneyValue.textContent = `${state.money}g`;
  intentStatus.textContent = statusMessage;
  tickValue.textContent = String(state.tick);
  updateStorageWindow(state);
  updateMarketWindow(state);
  updateContextualActions(state);
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
    return submission;
  }
  refresh(`Running ${submission.operationId}`);
  submission.completion.then((result) => {
    refresh(result.success ? result.code : `Stopped: ${result.code}`);
  });
  return submission;
}

const heldMovement = createHeldMovementController({
  getPlayer: () => controller.getSnapshot().world.entities.player,
  submit,
});

function canvasPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    mapId: controller.getSnapshot().world.entities.player.mapId,
    ...screenToWorld({
    screenX: event.clientX - bounds.left,
    screenY: event.clientY - bounds.top,
    displayWidth: bounds.width,
    displayHeight: bounds.height,
    canvasWidth: canvas.width,
    canvasHeight: canvas.height,
    camera,
    tileSize: RENDER_TILE_SIZE,
    }),
  };
}

canvas.addEventListener("click", (event) => {
  const target = canvasPosition(event);
  const action = actionForCanvasClick(controller.getSnapshot(), target, event);
  if (action.kind === "inspect") {
    objectInspector.select(action.target);
    objectInspectorDialog.open();
    return;
  }
  submit(action.command);
});

canvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  objectInspector.select(canvasPosition(event));
  objectInspectorDialog.open();
});

canvas.addEventListener("pointermove", (event) => {
  const nextTarget = canvasPosition(event);
  if (hoverTarget?.mapId === nextTarget.mapId
    && hoverTarget.x === nextTarget.x
    && hoverTarget.y === nextTarget.y) return;
  hoverTarget = nextTarget;
  refresh();
});

canvas.addEventListener("pointerleave", () => {
  hoverTarget = null;
  refresh();
});

hotbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-slot]");
  if (!button) return;
  runImmediate({ type: "select_slot", actorId: "player", slot: Number(button.dataset.slot) });
});

contextualActionsRoot.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-context-action]");
  if (!button) return;
  if (button.dataset.contextAction === "storage") openStorage(button.dataset.entityId);
  else if (button.dataset.contextAction === "market") openMarket();
  else if (button.dataset.contextAction === "sleep") sleepPlayer();
});

document.querySelector(".game-window").addEventListener("pointerdown", (event) => {
  if (event.target.closest("button, input, select, textarea, [contenteditable]")) return;
  canvas.focus({ preventScroll: true });
});

window.addEventListener("keydown", (event) => {
  const dialogOpen = document.querySelector('[role="dialog"]:not([hidden])');
  if (isEditingText(event.target) || (dialogOpen && document.activeElement !== canvas)) return;
  if (isMovementKey(event.key)) {
    event.preventDefault();
    heldMovement.press(event.key);
    return;
  }
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

window.addEventListener("keyup", (event) => {
  heldMovement.release(event.key);
});

window.addEventListener("blur", () => heldMovement.clear());

document.querySelector("#new-game-button").addEventListener("click", () => {
  if (!window.confirm("Start a new game? This will replace the current autosave.")) return;
  persistence.clear();
  hotbarSignature = null;
  storageSignature = null;
  controller.replaceState(createFarmState());
  refresh("New game started");
});

document.querySelector("#robot-demo-button").addEventListener("click", () => {
  const state = controller.getSnapshot();
  const robot = state.world.entities.robot;
  const target = Object.values(state.world.entities)
    .find((object) => object.type === "tree" && object.mapId === robot.mapId);
  if (!target) {
    refresh("No trees remain");
    return;
  }
  submit({
    type: "interact_at",
    actorId: "robot",
    target: { mapId: target.mapId, ...target.position },
    item: { itemId: "axe" },
  });
});

document.querySelector("#day-summary-continue-button").addEventListener("click", () => {
  daySummaryDialog.close();
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

document.querySelector("#inspector-button").addEventListener("click", () => {
  inspectorDialog.open();
});

document.querySelector("#action-log-button").addEventListener("click", () => {
  actionLogDialog.open();
});

document.querySelector("#sound-toggle").addEventListener("change", (event) => {
  gameAudio.setEnabled(event.target.checked);
  refresh(event.target.checked ? "Sound on" : "Sound off");
});

storageWindow.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-storage-direction]");
  if (!button || !activeStorageTargetId) return;
  const deposit = button.dataset.storageDirection === "deposit";
  const quantity = event.shiftKey ? Number(button.dataset.quantity) : 1;
  const result = controller.execute({
    source: "human-ui",
    type: "transfer_item",
    actorId: "player",
    fromEntityId: deposit ? "player" : activeStorageTargetId,
    toEntityId: deposit ? activeStorageTargetId : "player",
    itemId: button.dataset.itemId,
    quantity,
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