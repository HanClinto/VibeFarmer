const ACTOR_LABELS = Object.freeze({
  player: "You",
  robot: "Robot",
});

export function daySummaryView(summary) {
  return {
    title: `Day ${summary.day} Complete`,
    actors: Object.entries(summary.actors).map(([actorId, stats]) => ({
      actorId,
      label: ACTOR_LABELS[actorId] ?? actorId,
      rows: [
        ["Tiles traversed", stats.tilesTraversed],
        ["Actions taken", stats.actionsTaken],
        ["Tool uses", stats.toolUses],
        ["Crops harvested", stats.cropsHarvested],
        ["Items traded", stats.itemsBought + stats.itemsSold],
        ["Items transferred", stats.itemsTransferred],
      ],
    })),
    worldRows: [
      ["Crops advanced", summary.world.cropsGrown],
      ["Crops harvested", summary.world.cropsHarvested],
      ["Money earned", `${summary.world.moneyEarned}g`],
      ["Money spent", `${summary.world.moneySpent}g`],
      ["Ending balance", `${summary.endingBalance}g`],
    ],
  };
}

function definitionList(rows) {
  const list = document.createElement("dl");
  for (const [label, value] of rows) {
    const term = document.createElement("dt");
    term.textContent = label;
    const definition = document.createElement("dd");
    definition.textContent = String(value);
    list.append(term, definition);
  }
  return list;
}

export function renderDaySummary(root, summary) {
  const view = daySummaryView(summary);
  root.querySelector("[data-day-summary-title]").textContent = view.title;
  root.querySelector("[data-day-summary-actors]").replaceChildren(
    ...view.actors.map((actor) => {
      const section = document.createElement("section");
      const heading = document.createElement("h3");
      heading.textContent = actor.label;
      section.append(heading, definitionList(actor.rows));
      return section;
    }),
  );
  root.querySelector("[data-day-summary-world]").replaceChildren(
    definitionList(view.worldRows),
  );
  return view;
}