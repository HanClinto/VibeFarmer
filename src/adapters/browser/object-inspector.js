function titleCase(value) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function objectInspectionView(inspection) {
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
    } else if (entity.type === "chest") {
      fields.push(["Capacity", `${entity.usedSlots}/${entity.capacity} slots`]);
      fields.push(["Contents visible", entity.inventory ? "Yes" : "Move closer"]);
    } else if (entity.type === "actor") {
      fields.push(["Role", titleCase(entity.role)]);
      fields.push(["Stamina", `${entity.stamina}/${entity.maxStamina}`]);
      fields.push(["State", entity.activeIntent ? "Working" : entity.sleeping ? "Sleeping" : "Idle"]);
      fields.push(["Facing", titleCase(entity.facing)]);
    }
    return { title: entity.name, fields, entity };
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
  };
}

export function createObjectInspector({ root, controller, inspect, openRobotInspector }) {
  const title = root.querySelector("#object-inspector-title");
  const location = root.querySelector("#object-inspector-location");
  const content = root.querySelector("#object-inspector-content");
  const raw = root.querySelector("#object-inspector-raw");
  const robotButton = root.querySelector("#object-inspector-robot-button");
  let target = null;

  function refresh() {
    if (root.hidden || !target) return;
    const inspection = inspect(controller.getSnapshot(), "player", target);
    const view = objectInspectionView(inspection);
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
    raw.textContent = JSON.stringify(inspection, null, 2);
  }

  robotButton.addEventListener("click", openRobotInspector);
  return {
    select(nextTarget) {
      target = { ...nextTarget };
    },
    refresh,
  };
}