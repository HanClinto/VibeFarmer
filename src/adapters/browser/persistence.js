import { FARM_DEFINITION_VERSION } from "../../game/farm.js";

const STORAGE_KEY = "vibe-farmer.save";
const SAVE_VERSION = 4;
const GAME_STATE_VERSION = 5;

class UnsupportedSaveError extends Error {}
class OutdatedSaveError extends Error {}

export function serializeState(state) {
  return JSON.stringify({
    saveVersion: SAVE_VERSION,
    state,
  });
}

function validateState(state) {
  return state?.version === GAME_STATE_VERSION
    && Number.isInteger(state.tick)
    && state.world?.maps?.[state.world.defaultMapId]
    && state.world?.entities
    && state.operations
    && state.dayStats
    && "lastDaySummary" in state;
}

function parseEnvelope(serialized) {
  const envelope = JSON.parse(serialized);
  if (!Number.isInteger(envelope?.saveVersion)) throw new Error("Invalid save envelope");
  if (envelope.saveVersion > SAVE_VERSION) throw new UnsupportedSaveError();
  if (Number.isInteger(envelope.state?.version)
    && envelope.state.version > GAME_STATE_VERSION) throw new UnsupportedSaveError();
  if (envelope.saveVersion < SAVE_VERSION
    || (Number.isInteger(envelope.state?.version)
      && envelope.state.version < GAME_STATE_VERSION)) throw new OutdatedSaveError();
  if (envelope.saveVersion !== SAVE_VERSION || !validateState(envelope.state)) {
    throw new Error("Invalid save data");
  }
  const definitionVersion = envelope.state.world.definitionVersion;
  if (envelope.state.world.definitionId === "farm"
    && definitionVersion > FARM_DEFINITION_VERSION) throw new UnsupportedSaveError();
  if (envelope.state.world.definitionId === "farm"
    && definitionVersion < FARM_DEFINITION_VERSION) throw new OutdatedSaveError();
  return envelope.state;
}

export function restoreState(serialized) {
  const state = parseEnvelope(serialized);
  const defaultMap = state.world.maps[state.world.defaultMapId];
  state.world.width = defaultMap.width;
  state.world.height = defaultMap.height;
  state.world.terrain = defaultMap.terrain;

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
      } catch (error) {
        if (error instanceof UnsupportedSaveError) {
          return { state: null, code: "SAVE_UNSUPPORTED" };
        }
        if (error instanceof OutdatedSaveError) {
          storage.removeItem(STORAGE_KEY);
          return { state: null, code: "SAVE_OUTDATED" };
        }
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