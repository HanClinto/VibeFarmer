import { createController } from "../../application/controller.js";
import { GAME_CONFIG, createGameState, createWorld } from "../../game/index.js";
import { renderGame } from "./renderer.js";

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

const controller = createController(createFarmState());

function updateHotbar(state) {
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
  const state = controller.getSnapshot();
  renderGame(context, state);
  updateHotbar(state);
  staminaValue.textContent = `${state.actors.player.stamina}/${GAME_CONFIG.maxStamina}`;
  intentStatus.textContent = message;
}

function run(command) {
  const result = controller.execute(command);
  refresh(result.success ? result.code : `Cannot act: ${result.code}`);
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
  run({
    type: event.shiftKey ? "interact_at" : "move_to",
    actorId: "player",
    target: canvasPosition(event),
  });
});

hotbar.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-slot]");
  if (!button) return;
  run({ type: "select_slot", actorId: "player", slot: Number(button.dataset.slot) });
});

window.addEventListener("keydown", (event) => {
  if (!/^[0-9]$/.test(event.key)) return;
  run({
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
  const target = Object.values(controller.getSnapshot().world.objects)
    .find((object) => object.type === "tree");
  if (!target) {
    refresh("No trees remain");
    return;
  }
  run({ type: "interact_at", actorId: "robot", target, item: { itemId: "axe" } });
});

document.querySelector("#help-button").addEventListener("click", () => {
  window.alert("Left-click to walk. Shift-click a tree with the axe selected to walk adjacent and swing once. Keys 1-0 select inventory slots.");
});

refresh();