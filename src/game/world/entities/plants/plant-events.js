import { getTerrainAt, isWateredTerrain } from "../../terrain/terrain.js";

export function onDayEnd(state, _event, plant, context) {
  if (!isWateredTerrain(getTerrainAt(state.world, plant.position))) return;
  if (plant.growthStage >= plant.matureStage) return;

  plant.growthStage += 1;
  context.emit({
    type: "crop_grew",
    entityId: plant.id,
    growthStage: plant.growthStage,
  });
}

export const plantEventHandlers = Object.freeze({
  day_end: onDayEnd,
});