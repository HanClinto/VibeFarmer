const DIRECTIONS = {
  arrowup: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  arrowright: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
  arrowdown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  arrowleft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
};

const FACING = {
  north: DIRECTIONS.arrowup,
  east: DIRECTIONS.arrowright,
  south: DIRECTIONS.arrowdown,
  west: DIRECTIONS.arrowleft,
};

function normalizedMovementKey(key) {
  const normalizedKey = key.toLowerCase();
  return DIRECTIONS[normalizedKey] ? normalizedKey : null;
}

export function isMovementKey(key) {
  return normalizedMovementKey(key) !== null;
}

export function createHeldMovementController({ getPlayer, submit }) {
  const heldKeys = [];
  let movementInFlight = false;

  function release(key) {
    const normalizedKey = normalizedMovementKey(key);
    if (!normalizedKey) return false;
    const index = heldKeys.indexOf(normalizedKey);
    if (index !== -1) heldKeys.splice(index, 1);
    return true;
  }

  function pump() {
    if (movementInFlight || heldKeys.length === 0) return;
    const command = commandForGameplayKey(heldKeys.at(-1), getPlayer());
    const submission = submit(command);
    if (!submission?.success || !submission.completion) return;
    movementInFlight = true;
    submission.completion.finally(() => {
      movementInFlight = false;
      queueMicrotask(pump);
    });
  }

  return {
    press(key) {
      const normalizedKey = normalizedMovementKey(key);
      if (!normalizedKey) return false;
      release(normalizedKey);
      heldKeys.push(normalizedKey);
      pump();
      return true;
    },
    release,
    clear() {
      heldKeys.length = 0;
    },
  };
}

function offset(position, direction) {
  return { x: position.x + direction.x, y: position.y + direction.y };
}

export function commandForGameplayKey(key, player) {
  const normalizedKey = key.toLowerCase();
  const movement = DIRECTIONS[normalizedKey];
  if (movement) {
    return {
      type: "move_to",
      actorId: player.id,
      target: offset(player.position, movement),
    };
  }

  if (normalizedKey !== "e" && normalizedKey !== " ") return null;
  const selectedItem = player.inventory[player.selectedSlot - 1];
  return {
    type: "interact_at",
    actorId: player.id,
    target: offset(player.position, FACING[player.facing]),
    item: selectedItem === null ? { action: "harvest" } : undefined,
  };
}