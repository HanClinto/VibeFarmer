import { selectSlot } from "../game/actions/actions.js";
import { interactAt, moveTo } from "../game/world/entities/actors/intents.js";

function outcome(success, code, details = {}) {
  return { success, code, ...details };
}

export function createController(initialState) {
  let state = initialState;
  const listeners = new Set();

  function publish(result) {
    for (const listener of listeners) listener({ state, result });
    return result;
  }

  return {
    getSnapshot() {
      return state;
    },

    execute(command) {
      let result;
      switch (command.type) {
        case "move_to":
          result = moveTo(state, command.actorId, command.target);
          break;
        case "interact_at":
          result = interactAt(state, command.actorId, command.target, command.item ?? {});
          break;
        case "select_slot":
          result = selectSlot(state, command.actorId, command.slot);
          break;
        default:
          result = outcome(false, "UNKNOWN_COMMAND", { commandType: command.type });
      }
      return publish(result);
    },

    replaceState(nextState) {
      state = nextState;
      return publish(outcome(true, "STATE_REPLACED"));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}