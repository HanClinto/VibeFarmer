import {
  buyItem,
  selectSlot,
  sellItem,
  sleepAnyway,
  sleepActor,
  transferItem,
} from "../game/actions/actions.js";
import { isOperationTerminal, tick as tickGame } from "../game/simulation.js";
import { submitInteractAt, submitMoveTo } from "../game/world/entities/actors/intents.js";

function outcome(success, code, details = {}) {
  return { success, code, ...details };
}

export function createController(initialState) {
  let state = initialState;
  let ticksEnabled = true;
  const listeners = new Set();
  const completions = new Map();

  function publish(result) {
    for (const listener of listeners) listener({ state, result });
    return result;
  }

  function recordCommand(command) {
    state.history.push({
      type: "command_submitted",
      tick: state.tick,
      actorId: command.actorId ?? null,
      source: command.source ?? "unknown",
      command: JSON.parse(JSON.stringify(command)),
    });
    if (state.history.length > 200) state.history.shift();
  }

  return {
    getSnapshot() {
      return state;
    },

    execute(command) {
      recordCommand(command);
      let result;
      switch (command.type) {
        case "select_slot":
          result = selectSlot(state, command.actorId, command.slot);
          break;
        case "sleep_actor":
          result = sleepActor(state, command.actorId);
          break;
        case "sleep_anyway":
          result = sleepAnyway(state, command.actorId);
          break;
        case "buy_item":
          result = buyItem(state, command.actorId, command.itemId, command.quantity);
          break;
        case "sell_item":
          result = sellItem(state, command.actorId, command.itemId, command.quantity);
          break;
        case "transfer_item":
          result = transferItem(state, command.actorId, command);
          break;
        default:
          result = outcome(false, "UNKNOWN_COMMAND", { commandType: command.type });
      }
      return publish(result);
    },

    submit(command) {
      recordCommand(command);
      let result;
      if (command.type === "move_to") {
        result = submitMoveTo(state, command.actorId, command.target);
      } else if (command.type === "interact_at") {
        result = submitInteractAt(state, command.actorId, command.target, command.item ?? {});
      } else {
        return publish(outcome(false, "UNKNOWN_INTENT", { commandType: command.type }));
      }
      publish(result);
      if (!result.success) return result;
      if (!ticksEnabled) state.operations[result.operationId].status = "waiting_for_ticks";

      const completion = new Promise((resolve) => {
        completions.set(result.operationId, resolve);
      });
      return { ...result, completion };
    },

    tick(count = 1) {
      if (!ticksEnabled) {
        return publish(outcome(true, "TICKS_PAUSED", { tick: state.tick }));
      }
      for (let index = 0; index < count; index += 1) tickGame(state);
      for (const [operationId, resolve] of completions) {
        const operation = state.operations[operationId];
        if (!isOperationTerminal(operation)) continue;
        completions.delete(operationId);
        resolve(operation.result);
      }
      return publish(outcome(true, "TICK_COMPLETE", { tick: state.tick }));
    },

    setTicksEnabled(enabled) {
      ticksEnabled = Boolean(enabled);
      for (const operation of Object.values(state.operations)) {
        if (isOperationTerminal(operation)) continue;
        operation.status = ticksEnabled ? "running" : "waiting_for_ticks";
      }
      return publish(outcome(true, ticksEnabled ? "TICKS_ENABLED" : "TICKS_PAUSED"));
    },

    cancel(operationId) {
      const operation = state.operations[operationId];
      if (!operation) return publish(outcome(false, "OPERATION_NOT_FOUND"));
      if (isOperationTerminal(operation)) {
        return publish(outcome(false, "OPERATION_ALREADY_FINISHED"));
      }
      operation.cancellationRequested = true;
      return publish(outcome(true, "CANCELLATION_REQUESTED", { operationId }));
    },

    replaceState(nextState) {
      for (const [operationId, resolve] of completions) {
        resolve(outcome(false, "STATE_REPLACED", { operationId }));
      }
      completions.clear();
      state = nextState;
      return publish(outcome(true, "STATE_REPLACED"));
    },

    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}