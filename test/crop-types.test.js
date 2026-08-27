import assert from "node:assert/strict";
import test from "node:test";

import { harvest, useItem } from "../src/game/actions/actions.js";
import {
  CROP_TYPES,
  deterministicHarvestQuantity,
} from "../src/game/world/entities/plants/crop-types.js";
import { createGameState } from "../src/game/state.js";
import { createPlant } from "../src/game/world/entities/plants/plants.js";
import { getItemQuantity } from "../src/game/world/entities/containers/inventory.js";
import { addWorldEntity } from "../src/game/world/world.js";

test("crop definitions own growth, economy, yield, and regrowth rules", () => {
  assert.deepEqual(Object.keys(CROP_TYPES), ["turnip", "potato", "corn", "pumpkin"]);
  assert.equal(CROP_TYPES.potato.yield.minimum, 2);
  assert.equal(CROP_TYPES.potato.yield.maximum, 4);
  assert.equal(CROP_TYPES.corn.regrowDays, 2);
  assert.equal(CROP_TYPES.pumpkin.sellPrice, 80);
});

test("every seed item plants its configured crop and hoe refunds that seed", () => {
  for (const crop of Object.values(CROP_TYPES)) {
    const state = createGameState();
    const target = { x: 1, y: 2 };
    state.world.terrain[2][1] = "tilled";
    state.world.entities.player.inventory[3] = null;
    state.world.entities.player.inventory[4] = { itemId: crop.seedItemId, quantity: 2 };

    assert.equal(useItem(state, "player", target, { itemId: crop.seedItemId }).code, "ITEM_USED");
    const plant = Object.values(state.world.entities).find((entity) => entity.type === "plant");
    assert.equal(plant.cropType, crop.id);
    assert.equal(useItem(state, "player", target, { itemId: "hoe" }).code, "ITEM_USED");
    assert.equal(getItemQuantity(state.world.entities.player.inventory, crop.seedItemId), 2);
  }
});

test("potato yield is deterministic and stays within two to four", () => {
  const definition = CROP_TYPES.potato;
  const quantities = ["potato-a", "potato-b", "potato-c"].map((id) => (
    deterministicHarvestQuantity({ id, harvestCount: 0 }, definition)
  ));

  assert.deepEqual(quantities, [3, 4, 2]);
});

test("corn remains planted after harvest and regrows in two watered nights", () => {
  const state = createGameState();
  const target = { x: 1, y: 2 };
  const plant = createPlant({ id: "corn-test", cropType: "corn", position: target });
  plant.growthStage = plant.matureStage;
  addWorldEntity(state.world, plant);

  const result = harvest(state, "player", target);

  assert.equal(result.quantity, 2);
  assert.equal(result.regrows, true);
  assert.equal(state.world.entities[plant.id], plant);
  assert.equal(plant.growthStage, plant.matureStage - 2);
});