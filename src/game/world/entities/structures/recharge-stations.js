export const RECHARGE_STATION_CAPACITY = 40;

export function createRechargeStation({ id, position, charge = RECHARGE_STATION_CAPACITY }) {
  return {
    id,
    type: "recharge_station",
    name: "Solar Charging Station",
    blocking: true,
    position: { ...position },
    charge,
    capacity: RECHARGE_STATION_CAPACITY,
  };
}

export function onDayBegin(_state, _event, station, context) {
  const previousCharge = station.charge;
  station.charge = station.capacity;
  if (previousCharge < station.capacity) {
    context.emit({
      type: "station_solar_refilled",
      entityId: station.id,
      previousCharge,
      charge: station.charge,
    });
  }
}

export const rechargeStationEventHandlers = Object.freeze({
  day_begin: onDayBegin,
});