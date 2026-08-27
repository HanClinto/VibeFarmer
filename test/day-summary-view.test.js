import assert from "node:assert/strict";
import test from "node:test";

import { daySummaryView } from "../src/adapters/browser/day-summary.js";

test("day summary view presents human, robot, and farm statistics", () => {
  const view = daySummaryView({
    day: 3,
    actors: {
      player: {
        tilesTraversed: 12,
        actionsTaken: 4,
        toolUses: 3,
        cropsHarvested: 1,
        itemsBought: 0,
        itemsSold: 1,
        itemsTransferred: 2,
      },
      robot: {
        tilesTraversed: 20,
        actionsTaken: 7,
        toolUses: 6,
        cropsHarvested: 0,
        itemsBought: 1,
        itemsSold: 0,
        itemsTransferred: 0,
      },
    },
    world: { cropsGrown: 2, cropsHarvested: 1, moneyEarned: 10, moneySpent: 5 },
    endingBalance: 105,
  });

  assert.equal(view.title, "Day 3 Complete");
  assert.equal(view.actors[0].label, "You");
  assert.deepEqual(view.actors[0].rows[0], ["Tiles traversed", 12]);
  assert.deepEqual(view.actors[1].rows[1], ["Actions taken", 7]);
  assert.deepEqual(view.worldRows.at(-1), ["Ending balance", "105g"]);
});