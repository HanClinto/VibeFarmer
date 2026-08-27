import { GAME_CONFIG } from "../../../config.js";

export function findItemSlot(inventory, itemId) {
  return inventory.findIndex((stack) => stack?.itemId === itemId);
}

export function canAddItem(inventory, itemId, quantity) {
  let remaining = quantity;
  for (const stack of inventory) {
    if (stack?.itemId === itemId) remaining -= GAME_CONFIG.maxStackSize - stack.quantity;
    else if (stack === null) remaining -= GAME_CONFIG.maxStackSize;
    if (remaining <= 0) return true;
  }
  return false;
}

export function addItem(inventory, itemId, quantity) {
  if (!canAddItem(inventory, itemId, quantity)) return false;
  let remaining = quantity;

  for (const stack of inventory) {
    if (stack?.itemId !== itemId || stack.quantity >= GAME_CONFIG.maxStackSize) continue;
    const added = Math.min(remaining, GAME_CONFIG.maxStackSize - stack.quantity);
    stack.quantity += added;
    remaining -= added;
    if (remaining === 0) return true;
  }

  for (let index = 0; index < inventory.length && remaining > 0; index += 1) {
    if (inventory[index] !== null) continue;
    const added = Math.min(remaining, GAME_CONFIG.maxStackSize);
    inventory[index] = { itemId, quantity: added };
    remaining -= added;
  }
  return true;
}

export function removeItem(inventory, itemId, quantity) {
  const available = inventory.reduce(
    (total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0),
    0,
  );
  if (available < quantity) return false;

  let remaining = quantity;
  for (let index = inventory.length - 1; index >= 0 && remaining > 0; index -= 1) {
    const stack = inventory[index];
    if (stack?.itemId !== itemId) continue;
    const removed = Math.min(remaining, stack.quantity);
    stack.quantity -= removed;
    remaining -= removed;
    if (stack.quantity === 0) inventory[index] = null;
  }
  return true;
}