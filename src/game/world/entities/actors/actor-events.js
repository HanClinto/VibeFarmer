import { GAME_CONFIG } from "../../../config.js";

export function onDayBegin(_state, _event, actor) {
  actor.stamina = GAME_CONFIG.maxStamina;
  actor.sleeping = actor.role === "robot";
  actor.motion = null;
}

export const actorEventHandlers = Object.freeze({
  day_begin: onDayBegin,
});