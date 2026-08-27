export const CROP_TYPES = Object.freeze({
  turnip: Object.freeze({
    id: "turnip",
    name: "Turnip",
    seedItemId: "turnip_seeds",
    produceItemId: "turnip",
    matureStage: 3,
    yield: Object.freeze({ minimum: 1, maximum: 1 }),
    regrowDays: null,
    seedPrice: 5,
    sellPrice: 15,
  }),
  potato: Object.freeze({
    id: "potato",
    name: "Potato",
    seedItemId: "potato_seeds",
    produceItemId: "potato",
    matureStage: 4,
    yield: Object.freeze({ minimum: 2, maximum: 4 }),
    regrowDays: null,
    seedPrice: 12,
    sellPrice: 9,
  }),
  corn: Object.freeze({
    id: "corn",
    name: "Corn",
    seedItemId: "corn_seeds",
    produceItemId: "corn",
    matureStage: 5,
    yield: Object.freeze({ minimum: 2, maximum: 2 }),
    regrowDays: 2,
    seedPrice: 30,
    sellPrice: 18,
  }),
  pumpkin: Object.freeze({
    id: "pumpkin",
    name: "Pumpkin",
    seedItemId: "pumpkin_seeds",
    produceItemId: "pumpkin",
    matureStage: 6,
    yield: Object.freeze({ minimum: 1, maximum: 1 }),
    regrowDays: null,
    seedPrice: 35,
    sellPrice: 80,
  }),
});

export function getCropType(cropType) {
  return CROP_TYPES[cropType] ?? null;
}

export function getCropTypeBySeed(itemId) {
  return Object.values(CROP_TYPES).find((crop) => crop.seedItemId === itemId) ?? null;
}

export function deterministicHarvestQuantity(plant, definition) {
  const range = definition.yield.maximum - definition.yield.minimum + 1;
  if (range === 1) return definition.yield.minimum;
  const key = `${plant.id}:${plant.harvestCount}`;
  let hash = 0;
  for (const character of key) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return definition.yield.minimum + (hash % range);
}