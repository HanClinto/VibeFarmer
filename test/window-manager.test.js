import assert from "node:assert/strict";
import test from "node:test";

import { createWindowManager, isEditingText } from "../src/adapters/browser/window-manager.js";

function fakeControl() {
  return {
    focused: false,
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    focus() {
      this.focused = true;
    },
  };
}

function fakeWindow(closeButton) {
  return {
    hidden: true,
    style: {},
    querySelector: () => closeButton,
  };
}

test("gameplay shortcuts ignore editable browser controls", () => {
  const originalHTMLElement = globalThis.HTMLElement;
  globalThis.HTMLElement = class HTMLElement {};
  try {
    const textarea = Object.assign(new globalThis.HTMLElement(), {
      isContentEditable: false,
      tagName: "TEXTAREA",
    });
    const button = Object.assign(new globalThis.HTMLElement(), {
      isContentEditable: false,
      tagName: "BUTTON",
    });
    assert.equal(isEditingText(textarea), true);
    assert.equal(isEditingText(button), false);
  } finally {
    globalThis.HTMLElement = originalHTMLElement;
  }
});

test("Escape closes only the frontmost window and restores its launcher", () => {
  let keydown;
  const documentRoot = {
    addEventListener(type, listener) {
      if (type === "keydown") keydown = listener;
    },
  };
  const manager = createWindowManager(documentRoot);
  const firstLauncher = fakeControl();
  const firstClose = fakeControl();
  const firstWindow = fakeWindow(firstClose);
  const secondLauncher = fakeControl();
  const secondClose = fakeControl();
  const secondWindow = fakeWindow(secondClose);
  const first = manager.register({
    windowElement: firstWindow,
    launcher: firstLauncher,
    closeButton: firstClose,
  });
  const second = manager.register({
    windowElement: secondWindow,
    launcher: secondLauncher,
    closeButton: secondClose,
  });

  first.open();
  second.open();
  let prevented = false;
  keydown({ key: "Escape", preventDefault: () => { prevented = true; } });

  assert.equal(firstWindow.hidden, false);
  assert.equal(secondWindow.hidden, true);
  assert.equal(secondLauncher.focused, true);
  assert.equal(firstLauncher.focused, false);
  assert.equal(prevented, true);
});