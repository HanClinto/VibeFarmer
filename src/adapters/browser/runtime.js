import { GAME_CONFIG } from "../../game/config.js";

export const GAME_SPEEDS = Object.freeze([0, 1, 2, 5, 10]);

export function createRuntime(controller, { onFrame = () => {} } = {}) {
  let speed = 1;
  let previousTime = null;
  let accumulatedMs = 0;
  let frameId = null;

  function frame(now) {
    if (previousTime === null) previousTime = now;
    const elapsedMs = Math.min(now - previousTime, GAME_CONFIG.maxCatchUpMs);
    previousTime = now;

    if (speed > 0) {
      accumulatedMs += elapsedMs * speed;
      const ticks = Math.floor(accumulatedMs / GAME_CONFIG.tickDurationMs);
      if (ticks > 0) {
        accumulatedMs -= ticks * GAME_CONFIG.tickDurationMs;
        controller.tick(ticks);
      }
    }
    onFrame(controller.getSnapshot(), accumulatedMs / GAME_CONFIG.tickDurationMs);
    frameId = requestAnimationFrame(frame);
  }

  return {
    start() {
      if (frameId === null) frameId = requestAnimationFrame(frame);
    },
    stop() {
      if (frameId !== null) cancelAnimationFrame(frameId);
      frameId = null;
      previousTime = null;
      accumulatedMs = 0;
    },
    setSpeed(nextSpeed) {
      if (!GAME_SPEEDS.includes(nextSpeed)) throw new RangeError("Unsupported game speed");
      speed = nextSpeed;
      return speed;
    },
    getSpeed() {
      return speed;
    },
  };
}