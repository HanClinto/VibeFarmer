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

export function createHeldMovementController({ getPlayer, submit, replace = submit }) {
  const heldKeys = [];
  let activeCompletion = null;

  function release(key) {
    const normalizedKey = normalizedMovementKey(key);
    if (!normalizedKey) return false;
    const index = heldKeys.indexOf(normalizedKey);
    if (index !== -1) heldKeys.splice(index, 1);
    return true;
  }

  function start(command, submitCommand) {
    const submission = submitCommand(command);
    if (!submission?.success || !submission.completion) return submission;
    activeCompletion = submission.completion;
    submission.completion.finally(() => {
      if (activeCompletion !== submission.completion) return;
      activeCompletion = null;
      queueMicrotask(pump);
    });
    return submission;
  }

  function pump() {
    if (activeCompletion || heldKeys.length === 0) return;
    const command = commandForGameplayKey(heldKeys.at(-1), getPlayer());
    start(command, submit);
  }

  return {
    press(key) {
      const normalizedKey = normalizedMovementKey(key);
      if (!normalizedKey) return false;
      const newlyPressed = !heldKeys.includes(normalizedKey);
      release(normalizedKey);
      heldKeys.push(normalizedKey);
      if (newlyPressed) {
        start(commandForGameplayKey(normalizedKey, getPlayer()), replace);
      } else {
        pump();
      }
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