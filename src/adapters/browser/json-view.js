const JSON_TOKEN = /("(?:\\.|[^"\\])*"\s*:)|("(?:\\.|[^"\\])*")|\b(true|false)\b|\b(null)\b|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/g;

function tokenType(token) {
  if (token.endsWith(":")) return "key";
  if (token.startsWith('"')) return "string";
  if (token === "true" || token === "false") return "boolean";
  if (token === "null") return "null";
  return "number";
}

export function jsonTokens(value) {
  const source = JSON.stringify(value, null, 2);
  const tokens = [];
  let offset = 0;
  for (const match of source.matchAll(JSON_TOKEN)) {
    if (match.index > offset) tokens.push({ type: "plain", text: source.slice(offset, match.index) });
    tokens.push({ type: tokenType(match[0]), text: match[0] });
    offset = match.index + match[0].length;
  }
  if (offset < source.length) tokens.push({ type: "plain", text: source.slice(offset) });
  return tokens;
}

export function renderJson(element, value) {
  const document = element.ownerDocument;
  element.classList.add("json-view");
  element.replaceChildren(...jsonTokens(value).map((token) => {
    if (token.type === "plain") return document.createTextNode(token.text);
    const span = document.createElement("span");
    span.className = `json-${token.type}`;
    span.textContent = token.text;
    return span;
  }));
}