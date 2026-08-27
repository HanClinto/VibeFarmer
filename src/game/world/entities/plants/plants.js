export const CROP_TYPES = Object.freeze({
  turnip: Object.freeze({
    id: "turnip",
    name: "Turnip",
    matureStage: 3,
  }),
});

export function createPlant({ id, cropType, position }) {
  const definition = CROP_TYPES[cropType];
  if (!definition) throw new RangeError(`Unknown crop type: ${cropType}`);
  return {
    id,
    type: "plant",
    cropType,
    position: { ...position },
    growthStage: 0,
    matureStage: definition.matureStage,
  };
}