let topWindowZIndex = 10;

export function bringWindowToFront(windowElement) {
  topWindowZIndex += 1;
  windowElement.style.zIndex = String(topWindowZIndex);
}

export function clampWindowPosition({ x, y }, windowSize, viewportSize) {
  return {
    x: Math.min(Math.max(0, x), Math.max(0, viewportSize.width - windowSize.width)),
    y: Math.min(Math.max(0, y), Math.max(0, viewportSize.height - windowSize.height)),
  };
}

export function makeWindowDraggable(windowElement) {
  const titleBar = windowElement.querySelector(":scope > .title-bar");
  if (!titleBar) throw new Error("Draggable windows require a direct title bar");

  function onPointerDown(event) {
    if (event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    bringWindowToFront(windowElement);

    const bounds = windowElement.getBoundingClientRect();
    const pointerOffset = {
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    };
    windowElement.style.left = `${bounds.left}px`;
    windowElement.style.top = `${bounds.top}px`;
    windowElement.style.setProperty?.("--window-top", `${bounds.top}px`);
    windowElement.style.marginLeft = "0";
    windowElement.style.transform = "none";
    titleBar.setPointerCapture(event.pointerId);

    function onPointerMove(moveEvent) {
      const position = clampWindowPosition(
        {
          x: moveEvent.clientX - pointerOffset.x,
          y: moveEvent.clientY - pointerOffset.y,
        },
        { width: bounds.width, height: bounds.height },
        { width: window.innerWidth, height: window.innerHeight },
      );
      windowElement.style.left = `${position.x}px`;
      windowElement.style.top = `${position.y}px`;
      windowElement.style.setProperty?.("--window-top", `${position.y}px`);
    }

    function onPointerUp(upEvent) {
      titleBar.releasePointerCapture(upEvent.pointerId);
      titleBar.removeEventListener("pointermove", onPointerMove);
      titleBar.removeEventListener("pointerup", onPointerUp);
      titleBar.removeEventListener("pointercancel", onPointerUp);
    }

    titleBar.addEventListener("pointermove", onPointerMove);
    titleBar.addEventListener("pointerup", onPointerUp);
    titleBar.addEventListener("pointercancel", onPointerUp);
  }

  titleBar.addEventListener("pointerdown", onPointerDown);
  const bringToFront = () => bringWindowToFront(windowElement);
  windowElement.addEventListener("pointerdown", bringToFront);

  return () => {
    titleBar.removeEventListener("pointerdown", onPointerDown);
    windowElement.removeEventListener("pointerdown", bringToFront);
  };
}