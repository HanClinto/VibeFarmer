import assert from "node:assert/strict";
import test from "node:test";

import {
  objectActionHints,
  objectInspectionView,
} from "../src/adapters/browser/object-inspector.js";

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
      yield: { minimum: 1, maximum: 1 },
      regrows: false,
      regrowDays: null,
    }],
  });

  assert.equal(view.title, "Turnip");
  assert.equal(view.location, "(4, 5)");
  assert.deepEqual(view.sections[0].fields, [
    ["Growth", "2/3"],
    ["Watered today", "Yes"],
    ["Harvest ready", "No"],
    ["Expected yield", "1"],
    ["Regrows", "No"],
  ]);
  assert.equal(view.sections.at(-1).title, "Terrain");
  assert.equal(view.storageEntityId, null);
  assert.equal(view.marketEntityId, null);
  assert.equal(view.sleepEntityId, null);
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

test("adjacent produce displays expose contextual market access", () => {
  const view = objectInspectionView({
    success: true,
    target: { x: 18, y: 11 },
    terrain: { type: "grass", watered: false, passable: true },
    entities: [{
      id: "market-corn-crate",
      type: "market",
      name: "Corn crate",
      canTrade: true,
    }],
  });

  assert.equal(view.title, "Corn crate");
  assert.equal(view.marketEntityId, "market-corn-crate");
  assert.deepEqual(view.sections[0].fields, [["Trade", "Available"]]);
});

test("only the adjacent player bed exposes human sleep", () => {
  const view = objectInspectionView({
    success: true,
    target: { x: 1, y: 2 },
    terrain: { type: "floor", watered: false, passable: true },
    entities: [{
      id: "bed-player",
      type: "bed",
      name: "Player bed",
      actorId: "player",
      canSleep: true,
    }],
  });

  assert.equal(view.sleepEntityId, "bed-player");
  assert.deepEqual(view.sections[0].fields, [["For", "You"], ["Sleep", "Available"]]);
});

test("charging station inspection presents energy and robot access", () => {
  const view = objectInspectionView({
    success: true,
    target: { x: 8, y: 6 },
    terrain: { type: "grass", watered: false, passable: true },
    entities: [{
      id: "recharge-station-1",
      type: "recharge_station",
      name: "Solar Charging Station",
      charge: 17,
      capacity: 40,
      canRecharge: false,
    }],
  });

  assert.deepEqual(view.sections[0].fields, [
    ["Charge", "17/40"],
    ["Blocks movement", "Yes"],
    ["Robot recharge", "Move robot closer"],
  ]);
});

test("action hints distinguish owned items from current selection", () => {
  const actor = {
    id: "player",
    selectedSlot: 2,
    inventory: [
      { itemId: "axe", quantity: 1 },
      { itemId: "hoe", quantity: 1 },
      null,
      { itemId: "turnip_seeds", quantity: 3 },
    ],
  };
  const inspection = {
    success: true,
    terrain: { type: "grass" },
    entities: [{ type: "tree" }],
  };

  assert.deepEqual(objectActionHints(inspection, actor), [["Chop", "Axe · slot 1"]]);
  actor.selectedSlot = 1;
  assert.deepEqual(objectActionHints(inspection, actor), [["Chop", "Axe selected"]]);
});

test("action hints stay compact for crops and farmable terrain", () => {
  const actor = {
    id: "player",
    selectedSlot: 1,
    inventory: [{ itemId: "axe", quantity: 1 }, null, null, null],
  };

  assert.deepEqual(objectActionHints({
    success: true,
    terrain: { type: "grass" },
    entities: [],
  }, actor), [["Till", "Requires Hoe"]]);
  assert.deepEqual(objectActionHints({
    success: true,
    terrain: { type: "tilled" },
    entities: [],
  }, actor), [
    ["Water", "Requires Watering Can"],
    ["Plant", "Requires Seeds"],
  ]);
  assert.deepEqual(objectActionHints({
    success: true,
    terrain: { type: "tilled" },
    entities: [{ type: "plant", harvestReady: false }],
  }, actor), [["Harvest", "Not ready"]]);
});