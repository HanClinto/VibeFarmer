import { GAME_CONFIG } from "../../../config.js";
import { getItemType } from "../items/item-types.js";

function maxStackSize(itemId) {
  return getItemType(itemId)?.maxStack ?? GAME_CONFIG.maxStackSize;
}

export function findItemSlot(inventory, itemId) {
  return inventory.findIndex((stack) => stack?.itemId === itemId);
}

export function getItemQuantity(inventory, itemId) {
  return inventory.reduce(
    (total, stack) => total + (stack?.itemId === itemId ? stack.quantity : 0),
    0,
  );
}

export function getAddableQuantity(inventory, itemId) {
  const maxStack = maxStackSize(itemId);
  return inventory.reduce((total, stack) => {
    if (stack?.itemId === itemId) return total + (maxStack - stack.quantity);
    if (stack === null) return total + maxStack;
    return total;
  }, 0);
}

export function canAddItem(inventory, itemId, quantity) {
  return getAddableQuantity(inventory, itemId) >= quantity;
}

export function addItem(inventory, itemId, quantity) {
  if (!canAddItem(inventory, itemId, quantity)) return false;
  const maxStack = maxStackSize(itemId);
  let remaining = quantity;

  for (const stack of inventory) {
    if (stack?.itemId !== itemId || stack.quantity >= maxStack) continue;
    const added = Math.min(remaining, maxStack - stack.quantity);
    stack.quantity += added;
    remaining -= added;
    if (remaining === 0) return true;
  }

  for (let index = 0; index < inventory.length && remaining > 0; index += 1) {
    if (inventory[index] !== null) continue;
    const added = Math.min(remaining, maxStack);
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