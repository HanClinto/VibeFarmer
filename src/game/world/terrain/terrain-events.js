export function onDayBegin(state) {
  for (const map of Object.values(state.world.maps)) {
    for (const row of map.terrain) {
      for (let x = 0; x < row.length; x += 1) {
        if (row[x] === "wet_tilled") row[x] = "tilled";
      }
    }
  }
}

export const terrainEventHandlers = Object.freeze({
  day_begin: onDayBegin,
});