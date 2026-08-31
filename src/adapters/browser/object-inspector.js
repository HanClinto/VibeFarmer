import { renderJson } from "./json-view.js";
import { ITEM_TYPES } from "../../game/world/entities/items/item-types.js";

function titleCase(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function itemCapability(actor, itemId) {
  const item = ITEM_TYPES[itemId];
  const slotIndex = actor?.inventory?.findIndex((stack) => stack?.itemId === itemId) ?? -1;
  if (slotIndex < 0) return `Requires ${item.name}`;
  return actor.selectedSlot === slotIndex + 1
    ? `${item.name} selected`
    : `${item.name} · slot ${slotIndex + 1}`;
}

function seedCapability(actor) {
  const slotIndex = actor?.inventory?.findIndex(
    (stack) => stack && ITEM_TYPES[stack.itemId]?.category === "seed",
  ) ?? -1;
  if (slotIndex < 0) return "Requires Seeds";
  const item = ITEM_TYPES[actor.inventory[slotIndex].itemId];
  return actor.selectedSlot === slotIndex + 1
    ? `${item.name} selected`
    : `${item.name} · slot ${slotIndex + 1}`;
}

export function objectActionHints(inspection, actor) {
  if (!inspection.success) return [];
  const entity = inspection.entities[0] ?? null;
  if (entity?.type === "tree") return [["Chop", itemCapability(actor, "axe")]];
  if (entity?.type === "plant") {
    return [["Harvest", entity.harvestReady ? "Ready" : "Not ready"]];
  }
  if (entity?.type === "chest") {
    return [["Open storage", entity.inventory ? "Ready" : "Move closer"]];
  }
  if (entity?.type === "market") {
    return [["Trade", entity.canTrade ? "Ready" : "Move closer"]];
  }
  if (entity?.type === "bed") {
    return [["Sleep", entity.actorId === actor?.id
      ? entity.canSleep ? "Ready" : "Move closer"
      : "Robot only"]];
  }
  if (entity?.type === "actor" && entity.role === "robot") {
    return [["Open storage", entity.inventory ? "Ready" : "Move closer"]];
  }
  if (entity?.type === "recharge_station") {
    return [["Recharge robot", entity.charge > 0 ? "Robot only" : "Empty until morning"]];
  }
  if (entity) return [];
  if (inspection.terrain.type === "grass") {
    const hints = [["Till", itemCapability(actor, "hoe")]];
    if (actor?.inventory?.some((stack) => stack?.itemId === "recharge_station")) {
      hints.push(["Place station", itemCapability(actor, "recharge_station")]);
    }
    return hints;
  }
  if (inspection.terrain.type === "tilled") {
    return [
      ["Water", itemCapability(actor, "watering_can")],
      ["Plant", seedCapability(actor)],
    ];
  }
  if (inspection.terrain.type === "wet_tilled") {
    return [["Plant", seedCapability(actor)]];
  }
  if (inspection.terrain.type === "path"
    && actor?.inventory?.some((stack) => stack?.itemId === "recharge_station")) {
    return [["Place station", itemCapability(actor, "recharge_station")]];
  }
  return [];
}

export function objectInspectionView(inspection, actor = null) {
  if (!inspection.success) return { title: "Inspection failed", sections: [] };
  const sections = inspection.entities.map((entity) => {
    const fields = [];
    if (entity.type === "tree") {
      fields.push(["Health", `${entity.hitPoints}/${entity.maxHitPoints}`]);
      fields.push(["Blocks movement", "Yes"]);
    } else if (entity.type === "plant") {
      fields.push(["Growth", `${entity.growthStage}/${entity.matureStage}`]);
      fields.push(["Watered today", entity.watered ? "Yes" : "No"]);
      fields.push(["Harvest ready", entity.harvestReady ? "Yes" : "No"]);
      fields.push([
        "Expected yield",
        entity.yield.minimum === entity.yield.maximum
          ? String(entity.yield.minimum)
          : `${entity.yield.minimum}-${entity.yield.maximum}`,
      ]);
      fields.push(["Regrows", entity.regrows ? `Every ${entity.regrowDays} nights` : "No"]);
    } else if (entity.type === "chest") {
      fields.push(["Capacity", `${entity.usedSlots}/${entity.capacity} slots`]);
      fields.push(["Contents visible", entity.inventory ? "Yes" : "Move closer"]);
    } else if (entity.type === "actor") {
      fields.push(["Role", titleCase(entity.role)]);
      fields.push(["Stamina", `${entity.stamina}/${entity.maxStamina}`]);
      fields.push(["State", entity.activeIntent ? "Working" : entity.sleeping ? "Sleeping" : "Idle"]);
      fields.push(["Facing", titleCase(entity.facing)]);
    } else if (entity.type === "market") {
      fields.push(["Trade", entity.canTrade ? "Available" : "Move closer"]);
    } else if (entity.type === "bed") {
      fields.push(["For", entity.actorId === "player" ? "You" : "Robot"]);
      fields.push(["Sleep", entity.canSleep ? "Available" : "Unavailable"]);
    } else if (entity.type === "recharge_station") {
      fields.push(["Charge", `${entity.charge}/${entity.capacity}`]);
      fields.push(["Blocks movement", "Yes"]);
      fields.push(["Robot recharge", entity.canRecharge ? "Available" : "Move robot closer"]);
    }
    return { title: entity.name, fields, entity };
  });
  const actions = objectActionHints(inspection, actor);
  sections.push({
    title: "Actions",
    fields: actions.length > 0 ? actions : [["Available", "None"]],
    entity: null,
  });
  sections.push({
    title: "Terrain",
    fields: [
      ["Type", titleCase(inspection.terrain.type)],
      ["Watered", inspection.terrain.watered ? "Yes" : "No"],
      ["Passable", inspection.terrain.passable ? "Yes" : "No"],
    ],
    entity: null,
  });
  return {
    title: inspection.entities[0]?.name ?? titleCase(inspection.terrain.type),
    location: `(${inspection.target.x}, ${inspection.target.y})`,
    sections,
    storageEntityId: inspection.entities.find(
      (entity) => entity.inventory && (entity.type === "chest" || entity.role === "robot"),
    )?.id ?? null,
    marketEntityId: inspection.entities.find((entity) => entity.canTrade)?.id ?? null,
    sleepEntityId: inspection.entities.find((entity) => entity.canSleep)?.id ?? null,
  };
}

export function createObjectInspector({
  root,
  controller,
  inspect,
  openRobotInspector,
  openStorage,
  openMarket,
  sleepAtBed,
}) {
  const title = root.querySelector("#object-inspector-title");
  const location = root.querySelector("#object-inspector-location");
  const content = root.querySelector("#object-inspector-content");
  const raw = root.querySelector("#object-inspector-raw");
  const robotButton = root.querySelector("#object-inspector-robot-button");
  const storageButton = root.querySelector("#object-inspector-storage-button");
  const marketButton = root.querySelector("#object-inspector-market-button");
  const sleepButton = root.querySelector("#object-inspector-sleep-button");
  let target = null;
  let storageEntityId = null;
  let marketEntityId = null;
  let sleepEntityId = null;

  function refresh() {
    if (root.hidden || !target) return;
    const state = controller.getSnapshot();
    const inspection = inspect(state, "player", target);
    const view = objectInspectionView(inspection, state.world.entities.player);
    storageEntityId = view.storageEntityId;
    marketEntityId = view.marketEntityId;
    sleepEntityId = view.sleepEntityId;
    title.textContent = view.title;
    location.textContent = view.location ?? "";
    content.replaceChildren(...view.sections.map((section) => {
      const fieldset = document.createElement("fieldset");
      const legend = document.createElement("legend");
      legend.textContent = section.title;
      const details = document.createElement("dl");
      details.className = "object-fields";
      for (const [termText, valueText] of section.fields) {
        const term = document.createElement("dt");
        term.textContent = termText;
        const value = document.createElement("dd");
        value.textContent = valueText;
        details.append(term, value);
      }
      fieldset.append(legend, details);
      return fieldset;
    }));
    robotButton.hidden = !inspection.entities?.some((entity) => entity.role === "robot");
    storageButton.hidden = storageEntityId === null;
    marketButton.hidden = marketEntityId === null;
    sleepButton.hidden = sleepEntityId === null;
    renderJson(raw, inspection);
  }

  robotButton.addEventListener("click", openRobotInspector);
  storageButton.addEventListener("click", () => {
    if (storageEntityId) openStorage(storageEntityId);
  });
  marketButton.addEventListener("click", () => {
    if (marketEntityId) openMarket(marketEntityId);
  });
  sleepButton.addEventListener("click", () => {
    if (sleepEntityId) sleepAtBed(sleepEntityId);
  });
  return {
    select(nextTarget) {
      target = { ...nextTarget };
    },
    refresh,
  };
}