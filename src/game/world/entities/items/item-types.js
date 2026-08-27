import { CROP_TYPES } from "../plants/crop-types.js";

const cropItems = Object.fromEntries(Object.values(CROP_TYPES).flatMap((crop) => [
  [crop.seedItemId, Object.freeze({
    id: crop.seedItemId,
    name: `${crop.name} Seeds`,
    category: "seed",
    cropType: crop.id,
    buyPrice: crop.seedPrice,
    maxStack: 99,
  })],
  [crop.produceItemId, Object.freeze({
    id: crop.produceItemId,
    name: crop.name,
    category: "produce",
    cropType: crop.id,
    sellPrice: crop.sellPrice,
    maxStack: 99,
  })],
]));

export const ITEM_TYPES = Object.freeze({
  axe: Object.freeze({ id: "axe", name: "Axe", category: "tool", maxStack: 1 }),
  hoe: Object.freeze({ id: "hoe", name: "Hoe", category: "tool", maxStack: 1 }),
  watering_can: Object.freeze({
    id: "watering_can",
    name: "Watering Can",
    category: "tool",
    maxStack: 1,
  }),
  ...cropItems,
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