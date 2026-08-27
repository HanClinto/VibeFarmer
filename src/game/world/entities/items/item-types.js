export const ITEM_TYPES = Object.freeze({
  axe: Object.freeze({ id: "axe", name: "Axe", category: "tool", maxStack: 1 }),
  hoe: Object.freeze({ id: "hoe", name: "Hoe", category: "tool", maxStack: 1 }),
  watering_can: Object.freeze({
    id: "watering_can",
    name: "Watering Can",
    category: "tool",
    maxStack: 1,
  }),
  turnip_seeds: Object.freeze({
    id: "turnip_seeds",
    name: "Turnip Seeds",
    category: "seed",
    buyPrice: 5,
    maxStack: 99,
  }),
  turnip: Object.freeze({
    id: "turnip",
    name: "Turnip",
    category: "produce",
    sellPrice: 15,
    maxStack: 99,
  }),
  logs: Object.freeze({
    id: "logs",
    name: "Logs",
    category: "resource",
    sellPrice: 5,
    maxStack: 99,
  }),
});

export function getItemType(itemId) {
  return ITEM_TYPES[itemId] ?? null;
}