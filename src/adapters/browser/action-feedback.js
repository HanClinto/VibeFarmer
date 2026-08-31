export const TIRED_CUE_DURATION_MS = 2800;

const FAILURE_MESSAGES = Object.freeze({
  ACTOR_BUSY: "Finish or cancel the current action first.",
  BED_NOT_ADJACENT: "Move beside your bed before going to sleep.",
  BED_REQUIRED: "You need a bed before you can sleep.",
  CHARGER_EMPTY: "This charging station is empty. It will refill tomorrow morning.",
  CHARGER_NOT_FOUND: "The robot needs an adjacent charging station.",
  CROP_NOT_READY: "This crop is not ready to harvest yet.",
  DESTINATION_UNREACHABLE: "There is no clear path to that tile.",
  INTERACTION_UNREACHABLE: "There is no clear place to stand beside that target.",
  INVENTORY_FULL: "Your inventory is full. Make room before doing that.",
  INVALID_AXE_TARGET: "The axe can only chop trees.",
  INVALID_HOE_TARGET: "Use the hoe on grass to till it, or on a crop to remove it.",
  INVALID_PLACEMENT_TARGET: "Place this on an empty grass or path tile.",
  INVALID_PLANT_TARGET: "Seeds need an empty tilled soil tile.",
  INVALID_WATER_TARGET: "The watering can works on dry tilled soil.",
  ITEM_NOT_FOUND: "That inventory slot is empty.",
  DESTINATION_NOT_ADJACENT: "Move beside the destination before transferring items.",
  MARKET_NOT_ADJACENT: "Move beside the Market before trading.",
  NOT_ENOUGH_MONEY: "There is not enough money in the shared wallet.",
  ROBOT_ALREADY_CHARGED: "The robot already has full stamina.",
  ROBOT_REQUIRED: "Only the robot can draw energy from this station.",
  SOURCE_NOT_ADJACENT: "Move beside the source before transferring items.",
  TARGET_DIFFERENT_MAP: "That target is on another map.",
  TARGET_NOT_ADJACENT: "Move beside that tile before using an item.",
  TARGET_OUT_OF_BOUNDS: "That tile is outside the map.",
  TRANSFER_NOT_PERMITTED: "Those containers cannot exchange items directly.",
});

export function actionFailureMessage(code, actorId = "player") {
  if (code === "NOT_ENOUGH_STAMINA") {
    return actorId === "robot"
      ? "Robot is out of stamina. Use its charging berth or a solar charging station."
      : "Too tired to work. Go home and sleep in your bed.";
  }
  return FAILURE_MESSAGES[code] ?? `Cannot act: ${code}`;
}