const STORAGE_KEY = "vibe-farmer.save";
const SAVE_VERSION = 1;
const GAME_STATE_VERSION = 2;

export function serializeState(state) {
  return JSON.stringify({
    saveVersion: SAVE_VERSION,
    state,
  });
}

function validateState(state) {
  return state?.version === GAME_STATE_VERSION
    && Number.isInteger(state.tick)
    && state.world?.entities
    && state.operations;
}

export function restoreState(serialized) {
  const envelope = JSON.parse(serialized);
  if (envelope?.saveVersion !== SAVE_VERSION || !validateState(envelope.state)) {
    throw new Error("Unsupported or invalid save data");
  }

  const state = envelope.state;
  const interruptedOperationIds = [];
  for (const operation of Object.values(state.operations)) {
    if (!["running", "waiting_for_ticks"].includes(operation.status)) continue;
    operation.status = "cancelled";
    operation.completedTick = state.tick;
    operation.cancellationRequested = false;
    operation.result = {
      success: false,
      code: "OPERATION_INTERRUPTED_RELOAD",
    };
    interruptedOperationIds.push(operation.operationId);
  }

  for (const entity of Object.values(state.world.entities)) {
    if (entity.type !== "actor") continue;
    entity.activeIntent = null;
    entity.motion = null;
  }

  for (const operationId of interruptedOperationIds) {
    state.history.push({
      type: "intent_cancelled",
      operationId,
      tick: state.tick,
      code: "OPERATION_INTERRUPTED_RELOAD",
    });
  }

  return { state, interruptedOperationIds };
}

export function createPersistence(
  storage,
  {
    delayMs = 300,
    setTimer = setTimeout,
    clearTimer = clearTimeout,
  } = {},
) {
  let timer = null;
  let latestState = null;

  function saveNow(state = latestState) {
    if (!state) return false;
    storage.setItem(STORAGE_KEY, serializeState(state));
    latestState = state;
    return true;
  }

  return {
    load() {
      const serialized = storage.getItem(STORAGE_KEY);
      if (!serialized) return { state: null, code: "NO_SAVE" };
      try {
        const restored = restoreState(serialized);
        return {
          ...restored,
          code: restored.interruptedOperationIds.length > 0
            ? "SAVE_RESTORED_WITH_INTERRUPTED_OPERATION"
            : "SAVE_RESTORED",
        };
      } catch (_error) {
        storage.removeItem(STORAGE_KEY);
        return { state: null, code: "SAVE_CORRUPT" };
      }
    },

    scheduleSave(state) {
      latestState = state;
      if (timer !== null) return;
      timer = setTimer(() => {
        timer = null;
        saveNow();
      }, delayMs);
    },

    flush(state) {
      if (timer !== null) clearTimer(timer);
      timer = null;
      return saveNow(state);
    },

    clear() {
      if (timer !== null) clearTimer(timer);
      timer = null;
      latestState = null;
      storage.removeItem(STORAGE_KEY);
    },
  };
}

export { STORAGE_KEY };