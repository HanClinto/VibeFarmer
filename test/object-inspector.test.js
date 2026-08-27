import assert from "node:assert/strict";
import test from "node:test";

import { objectInspectionView } from "../src/adapters/browser/object-inspector.js";

test("object inspection view presents crop state and terrain without parsing raw JSON", () => {
  const view = objectInspectionView({
    success: true,
    target: { x: 4, y: 5 },
    terrain: { type: "wet_tilled", watered: true, passable: true },
    entities: [{
      id: "plant-1",
      type: "plant",
      name: "Turnip",
      growthStage: 2,
      matureStage: 3,
      watered: true,
      harvestReady: false,
    }],
  });

  assert.equal(view.title, "Turnip");
  assert.equal(view.location, "(4, 5)");
  assert.deepEqual(view.sections[0].fields, [
    ["Growth", "2/3"],
    ["Watered today", "Yes"],
    ["Harvest ready", "No"],
  ]);
  assert.equal(view.sections.at(-1).title, "Terrain");
  assert.equal(view.storageEntityId, null);
});

test("adjacent inspectable containers expose their exact storage identity", () => {
  const view = objectInspectionView({
    success: true,
    target: { x: 4, y: 5 },
    terrain: { type: "grass", watered: false, passable: true },
    entities: [{
      id: "chest-1",
      type: "chest",
      name: "Farm Chest",
      capacity: 10,
      usedSlots: 1,
      inventory: [{ itemId: "logs", quantity: 2 }],
    }],
  });

  assert.equal(view.storageEntityId, "chest-1");
});