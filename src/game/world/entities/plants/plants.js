import { CROP_TYPES } from "./crop-types.js";

export { CROP_TYPES } from "./crop-types.js";

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
    harvestCount: 0,
  };
}