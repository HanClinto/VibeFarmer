export function parseSignMarkdown(markdown) {
  const lines = String(markdown ?? "").replaceAll("\r\n", "\n").split("\n");
  const blocks = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) {
      index += 1;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: heading[2] });
      index += 1;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push(lines[index].replace(/^[-*]\s+/, ""));
        index += 1;
      }
      blocks.push({ type: "list", items });
      continue;
    }

    const paragraph = [];
    while (index < lines.length
      && lines[index].trim()
      && !/^(#{1,3})\s+/.test(lines[index])
      && !/^[-*]\s+/.test(lines[index])) {
      paragraph.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ type: "paragraph", text: paragraph.join(" ") });
  }

  return blocks;
}

function appendInlineMarkdown(element, text) {
  const documentRoot = element.ownerDocument;
  const pattern = /(\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
  let offset = 0;

  for (const match of text.matchAll(pattern)) {
    element.append(documentRoot.createTextNode(text.slice(offset, match.index)));
    let child;
    if (match[2] && match[3]) {
      child = documentRoot.createElement("a");
      child.textContent = match[2];
      child.href = match[3];
      child.target = "_blank";
      child.rel = "noreferrer";
    } else if (match[4]) {
      child = documentRoot.createElement("strong");
      child.textContent = match[4];
    } else if (match[5]) {
      child = documentRoot.createElement("em");
      child.textContent = match[5];
    } else {
      child = documentRoot.createElement("code");
      child.textContent = match[6];
    }
    element.append(child);
    offset = match.index + match[0].length;
  }
  element.append(documentRoot.createTextNode(text.slice(offset)));
}

export function renderSignMarkdown(root, markdown) {
  const documentRoot = root.ownerDocument;
  const elements = parseSignMarkdown(markdown).map((block) => {
    if (block.type === "heading") {
      const heading = documentRoot.createElement(`h${block.level}`);
      appendInlineMarkdown(heading, block.text);
      return heading;
    }
    if (block.type === "list") {
      const list = documentRoot.createElement("ul");
      for (const item of block.items) {
        const listItem = documentRoot.createElement("li");
        appendInlineMarkdown(listItem, item);
        list.append(listItem);
      }
      return list;
    }
    const paragraph = documentRoot.createElement("p");
    appendInlineMarkdown(paragraph, block.text);
    return paragraph;
  });
  root.replaceChildren(...elements);
}