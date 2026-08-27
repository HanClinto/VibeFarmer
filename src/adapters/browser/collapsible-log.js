function createDetails(summaryText, value, open) {
  const details = document.createElement("details");
  details.className = "log-entry";
  details.open = open;
  const summary = document.createElement("summary");
  summary.textContent = summaryText;
  const content = document.createElement("pre");
  content.textContent = JSON.stringify(value, null, 2);
  details.append(summary, content);
  return details;
}

export function renderCollapsibleLog(
  container,
  records,
  { getId, getSummary, getValue = (record) => record },
) {
  const openIds = new Set(
    [...container.querySelectorAll("details[open]")].map((details) => details.dataset.recordId),
  );
  container.replaceChildren(...records.map((record) => {
    const id = getId(record);
    const details = createDetails(getSummary(record), getValue(record), openIds.has(id));
    details.dataset.recordId = id;
    return details;
  }));
}