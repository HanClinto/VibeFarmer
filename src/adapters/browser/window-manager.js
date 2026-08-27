import { bringWindowToFront } from "./draggable-windows.js";

function focusTarget(windowElement) {
  return windowElement.querySelector(
    "[autofocus], button:not([disabled]), select:not([disabled]), textarea:not([disabled]), input:not([disabled])",
  ) ?? windowElement;
}

export function isEditingText(target) {
  return target instanceof HTMLElement
    && (target.isContentEditable || ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName));
}

export function createWindowManager(documentRoot = document) {
  const registrations = [];

  function close(registration, restoreFocus = true) {
    registration.windowElement.hidden = true;
    if (restoreFocus) registration.launcher?.focus();
  }

  function frontmostOpenWindow() {
    return registrations
      .filter(({ windowElement }) => !windowElement.hidden)
      .sort((first, second) => (
        Number(second.windowElement.style.zIndex || 0)
        - Number(first.windowElement.style.zIndex || 0)
      ))[0];
  }

  documentRoot.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    const registration = frontmostOpenWindow();
    if (!registration) return;
    event.preventDefault();
    close(registration);
  });

  return {
    register({ windowElement, launcher, closeButton, onOpen }) {
      const registration = { windowElement, launcher };
      registrations.push(registration);
      closeButton.addEventListener("click", () => close(registration));

      return {
        open() {
          windowElement.hidden = false;
          bringWindowToFront(windowElement);
          onOpen?.();
          focusTarget(windowElement).focus();
        },
        close: () => close(registration),
      };
    },
  };
}