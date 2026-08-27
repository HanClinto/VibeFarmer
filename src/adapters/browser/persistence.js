import { upgradeFarmWorldDefinition } from "../../game/farm.js";

const STORAGE_KEY = "vibe-farmer.save";
const SAVE_VERSION = 2;
const GAME_STATE_VERSION = 3;

class UnsupportedSaveError extends Error {}

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
    && state.operations;
}

function migrateLegacyState(legacyState) {
  if (legacyState?.version !== 2 || !legacyState.world?.entities || !legacyState.operations) {
    throw new Error("Invalid legacy save data");
  }

  const state = legacyState;
  const world = state.world;
  world.definitionVersion = 1;
  world.defaultMapId = world.defaultMapId ?? "farm";
  world.maps ??= {
    [world.defaultMapId]: {
      id: world.defaultMapId,
      width: world.width,
      height: world.height,
      terrain: world.terrain,
    },
  };
  const defaultMap = world.maps[world.defaultMapId];
  if (!defaultMap) throw new Error("Legacy save has no default map");
  world.width = defaultMap.width;
  world.height = defaultMap.height;
  world.terrain = defaultMap.terrain;

  for (const entity of Object.values(world.entities)) {
    if (entity.position) entity.mapId ??= world.defaultMapId;
  }
  for (const operation of Object.values(state.operations)) {
    if (operation.command?.target) operation.command.target.mapId ??= world.defaultMapId;
    for (const step of operation.path ?? []) step.mapId ??= world.defaultMapId;
  }
  for (const event of state.history ?? []) {
    if (event.target) event.target.mapId ??= world.defaultMapId;
  }
  state.version = GAME_STATE_VERSION;
  return state;
}

function parseEnvelope(serialized) {
  const envelope = JSON.parse(serialized);
  if (!Number.isInteger(envelope?.saveVersion)) throw new Error("Invalid save envelope");
  if (envelope.saveVersion > SAVE_VERSION) throw new UnsupportedSaveError();
  if (Number.isInteger(envelope.state?.version)
    && envelope.state.version > GAME_STATE_VERSION) throw new UnsupportedSaveError();
  if (envelope.saveVersion === 1) {
    const state = migrateLegacyState(envelope.state);
    upgradeFarmWorldDefinition(state.world);
    return { state, migrated: true };
  }
  if (envelope.saveVersion !== SAVE_VERSION || !validateState(envelope.state)) {
    throw new Error("Invalid save data");
  }
  return {
    state: envelope.state,
    migrated: upgradeFarmWorldDefinition(envelope.state.world),
  };
}

export function restoreState(serialized) {
  const { state, migrated } = parseEnvelope(serialized);

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

  return { state, interruptedOperationIds, migrated };
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
          code: restored.migrated
            ? "SAVE_MIGRATED"
            : restored.interruptedOperationIds.length > 0
              ? "SAVE_RESTORED_WITH_INTERRUPTED_OPERATION"
              : "SAVE_RESTORED",
        };
      } catch (error) {
        if (error instanceof UnsupportedSaveError) {
          return { state: null, code: "SAVE_UNSUPPORTED" };
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