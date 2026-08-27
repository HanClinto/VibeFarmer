import { GAME_CONFIG } from "./config.js";
import { interactAt, moveTo } from "./intents.js";
import { renderGame } from "./renderer.js";
import { createGameState } from "./state.js";
import { createWorld } from "./world.js";

const canvas = document.querySelector("#game-canvas");
const context = canvas.getContext("2d");
const hotbar = document.querySelector("#hotbar");
const staminaValue = document.querySelector("#stamina-value");
const intentStatus = document.querySelector("#intent-status");

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

let state = createFarmState();

function updateHotbar() {
  hotbar.replaceChildren(...state.actors.player.inventory.map((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.slot = String(index + 1);
    button.setAttribute("aria-pressed", String(state.actors.player.selectedSlot === index + 1));
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

function refresh(message = "Ready") {
  renderGame(context, state);
  updateHotbar();
  staminaValue.textContent = `${state.actors.player.stamina}/${GAME_CONFIG.maxStamina}`;
  intentStatus.textContent = message;
}

function canvasPosition(event) {
  const bounds = canvas.getBoundingClientRect();
  return {
    x: Math.floor((event.clientX - bounds.left) / (bounds.width / state.world.width)),
    y: Math.floor((event.clientY - bounds.top) / (bounds.height / state.world.height)),
  };
}

canvas.addEventListener("click", (event) => {
  const target = canvasPosition(event);
  const result = event.shiftKey
    ? interactAt(state, "player", target)
    : moveTo(state, "player", target);
  refresh(result.success ? result.code : `Cannot act: ${result.code}`);
});

hotbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-slot]");
  if (!button) return;
  state.actors.player.selectedSlot = Number(button.dataset.slot);
  refresh(`Selected slot ${button.dataset.slot}`);
});

window.addEventListener("keydown", (event) => {
  if (!/^[0-9]$/.test(event.key)) return;
  state.actors.player.selectedSlot = event.key === "0" ? 10 : Number(event.key);
  refresh(`Selected slot ${state.actors.player.selectedSlot}`);
});

document.querySelector("#new-game-button").addEventListener("click", () => {
  state = createFarmState();
  refresh("New game started");
});

document.querySelector("#robot-demo-button").addEventListener("click", () => {
  const target = Object.values(state.world.objects).find((object) => object.type === "tree");
  if (!target) {
    refresh("No trees remain");
    return;
  }
  const result = interactAt(state, "robot", target, { itemId: "axe" });
  refresh(result.success ? "Robot used its axe once" : `Robot stopped: ${result.code}`);
});

document.querySelector("#help-button").addEventListener("click", () => {
  window.alert("Left-click to walk. Shift-click a tree with the axe selected to walk adjacent and swing once. Keys 1-0 select inventory slots.");
});

refresh();