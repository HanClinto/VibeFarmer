import { renderCollapsibleLog } from "./collapsible-log.js";

function eventActorId(event, state) {
  if (event.actorId) return event.actorId;
  if (event.requesterId) return event.requesterId;
  if (event.operationId) return state.operations[event.operationId]?.actorId ?? null;
  return null;
}

export function actionSummary(event) {
  const tick = event.tick ?? "?";
  if (event.type === "command_submitted") {
    const targetValue = event.command.target?.position ?? event.command.target;
    const target = Number.isFinite(targetValue?.x) && Number.isFinite(targetValue?.y)
      ? ` → (${targetValue.x},${targetValue.y})`
      : targetValue?.id
        ? ` → ${targetValue.id}`
        : "";
    return `[${tick}] ${event.source} · ${event.command.type}${target}`;
  }
  if (event.type === "move") return `[${tick}] moved → (${event.target.x},${event.target.y})`;
  if (event.type === "use_item") return `[${tick}] used ${event.itemId} → (${event.target.x},${event.target.y})`;
  if (event.type === "robot_recharged") {
    return `[${tick}] recharged +${event.transferred} · ${event.remainingCharge} stored`;
  }
  if (event.type === "station_solar_refilled") {
    return `[${tick}] solar refill · ${event.charge} stored`;
  }
  if (event.type.startsWith("intent_")) return `[${tick}] ${event.type} · ${event.code}`;
  return `[${tick}] ${event.type}`;
}

export function createActionLog({ root, controller }) {
  const playerLog = root.querySelector("#action-log-player");
  const robotLog = root.querySelector("#action-log-robot");
  const worldLog = root.querySelector("#action-log-world");
  let renderSignature = null;

  function refresh(force = false) {
    if (root.hidden) return;
    const state = controller.getSnapshot();
    const lastEvent = state.history.at(-1);
    const nextSignature = `${state.history.length}:${lastEvent?.tick ?? ""}:${lastEvent?.type ?? ""}`;
    if (!force && nextSignature === renderSignature) return;
    renderSignature = nextSignature;

    const indexedEvents = state.history.map((event, index) => ({ event, index }));
    const forActor = (actorId) => indexedEvents
      .filter(({ event }) => eventActorId(event, state) === actorId)
      .slice(-50)
      .reverse();
    const worldEvents = indexedEvents
      .filter(({ event }) => eventActorId(event, state) === null)
      .slice(-25)
      .reverse();
    const options = {
      getId: ({ index }) => String(index),
      getSummary: ({ event }) => actionSummary(event),
      getValue: ({ event }) => event,
    };

    renderCollapsibleLog(playerLog, forActor("player"), options);
    renderCollapsibleLog(robotLog, forActor("robot"), options);
    renderCollapsibleLog(worldLog, worldEvents, options);
  }

  return {
    open() {
      root.hidden = false;
      refresh(true);
    },
    refresh,
  };
}