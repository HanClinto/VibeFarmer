import { CARDINAL_DIRECTIONS } from "../config.js";
import { positionKey } from "./world.js";

function manhattan(first, second) {
  return Math.abs(first.x - second.x) + Math.abs(first.y - second.y);
}

function reconstructPath(nodes, currentKey) {
  const path = [];
  let key = currentKey;
  while (nodes.get(key).parentKey) {
    path.unshift(nodes.get(key).position);
    key = nodes.get(key).parentKey;
  }
  return path;
}

export function findPath(start, goal, isPassable) {
  if (start.x === goal.x && start.y === goal.y) return [];

  let sequence = 0;
  const startKey = positionKey(start);
  const nodes = new Map([
    [startKey, {
      position: { ...start },
      parentKey: null,
      cost: 0,
      estimate: manhattan(start, goal),
      sequence: sequence++,
    }],
  ]);
  const open = [startKey];
  const closed = new Set();

  while (open.length > 0) {
    open.sort((firstKey, secondKey) => {
      const first = nodes.get(firstKey);
      const second = nodes.get(secondKey);
      return (first.cost + first.estimate) - (second.cost + second.estimate)
        || first.estimate - second.estimate
        || first.sequence - second.sequence;
    });

    const currentKey = open.shift();
    const current = nodes.get(currentKey);
    if (current.position.x === goal.x && current.position.y === goal.y) {
      return reconstructPath(nodes, currentKey);
    }
    closed.add(currentKey);

    for (const direction of CARDINAL_DIRECTIONS) {
      const next = {
        x: current.position.x + direction.x,
        y: current.position.y + direction.y,
      };
      const nextKey = positionKey(next);
      if (closed.has(nextKey) || !isPassable(next)) continue;

      const nextCost = current.cost + 1;
      const known = nodes.get(nextKey);
      if (known && nextCost >= known.cost) continue;

      nodes.set(nextKey, {
        position: next,
        parentKey: currentKey,
        cost: nextCost,
        estimate: manhattan(next, goal),
        sequence: known?.sequence ?? sequence++,
      });
      if (!open.includes(nextKey)) open.push(nextKey);
    }
  }

  return null;
}