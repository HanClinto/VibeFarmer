import { renderSignMarkdown } from "./sign-markdown.js";

export function createSignWindow({ root, controller, onUpdated = () => {} }) {
  const title = root.querySelector("#sign-window-title");
  const message = root.querySelector("#sign-message-view");
  const editor = root.querySelector("#sign-editor");
  const input = root.querySelector("#sign-markdown-input");
  const status = root.querySelector("#sign-editor-status");
  const cancelButton = root.querySelector("#sign-edit-cancel-button");
  let entityId = null;

  function currentSign() {
    const entity = controller.getSnapshot().world.entities[entityId];
    return entity?.type === "sign" ? entity : null;
  }

  function showMessage() {
    editor.hidden = true;
    message.hidden = false;
    status.textContent = "";
  }

  function refresh() {
    const sign = currentSign();
    if (!sign) return;
    title.textContent = sign.name ?? "Wooden Sign";
    renderSignMarkdown(message, sign.markdown);
    showMessage();
  }

  function edit() {
    const sign = currentSign();
    if (!sign) return;
    input.value = sign.markdown;
    message.hidden = true;
    editor.hidden = false;
    input.focus();
    input.select();
  }

  message.addEventListener("click", (event) => {
    if (!event.target.closest("a")) edit();
  });
  message.addEventListener("keydown", (event) => {
    if (!["Enter", " "].includes(event.key)) return;
    event.preventDefault();
    edit();
  });
  cancelButton.addEventListener("click", showMessage);
  editor.addEventListener("submit", (event) => {
    event.preventDefault();
    const result = controller.execute({
      source: "human-ui",
      type: "update_sign",
      entityId,
      markdown: input.value,
    });
    if (!result.success) {
      status.textContent = "The sign could not be updated.";
      return;
    }
    refresh();
    onUpdated(result);
  });

  return {
    select(nextEntityId) {
      entityId = nextEntityId;
    },
    refresh,
  };
}