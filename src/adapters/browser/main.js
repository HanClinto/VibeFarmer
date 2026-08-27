import { createController } from "../../application/controller.js";
import { GAME_CONFIG, createGameState, createWorld } from "../../game/index.js";
import { renderGame } from "./renderer.js";
import { createRuntime } from "./runtime.js";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const hotbar = document.querySelector("#hotbar");
const staminaValue = document.querySelector("#stamina-value");
const intentStatus = document.querySelector("#intent-status");
const tickValue = document.querySelector("#tick-value");

function createFarmState() {
  return createGameState({
    world: createWorld({
      objects: [
        { type: "tree", x: 8, y: 2, hitPoints: GAME_CONFIG.treeHitPoints },
        { type: "tree", x: 9, y: 3, hitPoints: GAME_CONFIG.treeHitPoints },
        { type: "tree", x: 8, y: 6, hitPoints: GAME_CONFIG.treeHitPoints },
        { type: "tree", x: 10, y: 7, hitPoints: GAME_CONFIG.treeHitPoints },
      ],
    }),
  });
}

const controller = createController(createFarmState());
let statusMessage = "Ready";
let tickProgress = 1;
const runtime = createRuntime(controller, {
  onFrame: (_state, nextTickProgress) => {
    tickProgress = nextTickProgress;
    refresh();
  },
});

function updateHotbar(state) {
  const player = state.world.entities.player;
  hotbar.replaceChildren(...player.inventory.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.slot = String(index + 1);
    button.setAttribute("aria-pressed", String(player.selectedSlot === index + 1));
    button.title = item ? `Slot ${index + 1}: ${item.itemId}` : `Slot ${index + 1}: Empty`;

    const key = document.createElement("span");
    key.className = "slot-key";
    key.textContent = index === 9 ? "0" : String(index + 1);
    const label = document.createElement("span");
    label.className = "slot-item";
    label.textContent = item?.itemId ?? "";
    button.append(key, label);
    return button;
  }));
}

function refresh(message) {
  if (message) statusMessage = message;
  const state = controller.getSnapshot();
  renderGame(context, state, { tickProgress });
  updateHotbar(state);
  staminaValue.textContent = `${state.world.entities.player.stamina}/${GAME_CONFIG.maxStamina}`;
  intentStatus.textContent = statusMessage;
  tickValue.textContent = String(state.tick);
}

function runImmediate(command) {
  const result = controller.execute(command);
  refresh(result.success ? result.code : `Cannot act: ${result.code}`);
}

function submit(command) {
  const submission = controller.submit(command);
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
  submit({
    type: event.shiftKey ? "interact_at" : "move_to",
    actorId: "player",
    target: canvasPosition(event),
  });
});

hotbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-slot]");
  if (!button) return;
  runImmediate({ type: "select_slot", actorId: "player", slot: Number(button.dataset.slot) });
});

window.addEventListener("keydown", (event) => {
  if (!/^[0-9]$/.test(event.key)) return;
  runImmediate({
    type: "select_slot",
    actorId: "player",
    slot: event.key === "0" ? 10 : Number(event.key),
  });
});

document.querySelector("#new-game-button").addEventListener("click", () => {
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
  submit({ type: "interact_at", actorId: "robot", target, item: { itemId: "axe" } });
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
  window.alert("Left-click to walk. Shift-click a tree with the axe selected to walk adjacent and swing once. Keys 1-0 select inventory slots.");
});

refresh();
runtime.start();