import { actorEventHandlers } from "./world/entities/actors/actor-events.js";
import { plantEventHandlers } from "./world/entities/plants/plant-events.js";
import { terrainEventHandlers } from "./world/terrain/terrain-events.js";

const MAX_EVENTS_PER_DISPATCH = 100;

const globalHandlers = Object.freeze({
  day_begin: Object.freeze([terrainEventHandlers.day_begin]),
});

const entityHandlers = Object.freeze({
  actor: actorEventHandlers,
  plant: plantEventHandlers,
});

function recordEvent(state, event) {
  state.history.push({ ...event, tick: state.tick, day: state.day });
  if (state.history.length > 200) state.history.shift();
}

function dispatchEvent(state, event, queue) {
  recordEvent(state, event);
  const context = {
    emit(nextEvent) {
      queue.push(nextEvent);
    },
  };

  for (const handler of globalHandlers[event.type] ?? []) handler(state, event, context);

  const entities = Object.values(state.world.entities)
    .sort((first, second) => first.id.localeCompare(second.id));
  for (const entity of entities) {
    const handler = entityHandlers[entity.type]?.[event.type];
    if (handler) handler(state, event, entity, context);
  }
}

export function dispatchLifecycleEvent(state, eventType) {
  if (eventType !== "day_begin" && eventType !== "day_end") {
    throw new RangeError(`Unsupported lifecycle event: ${eventType}`);
  }

  const queue = [{ type: eventType }];
  let processed = 0;
  while (queue.length > 0) {
    if (processed >= MAX_EVENTS_PER_DISPATCH) {
      throw new Error("Event dispatch limit exceeded");
    }
    dispatchEvent(state, queue.shift(), queue);
    processed += 1;
  }
}