function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function computeCamera({
  focus,
  worldWidth,
  worldHeight,
  viewportWidth,
  viewportHeight,
  tileSize,
}) {
  const maximumX = Math.max(0, (worldWidth * tileSize) - viewportWidth);
  const maximumY = Math.max(0, (worldHeight * tileSize) - viewportHeight);
  return {
    x: Math.round(clamp(
      ((focus.x + 0.5) * tileSize) - (viewportWidth / 2),
      0,
      maximumX,
    )),
    y: Math.round(clamp(
      ((focus.y + 0.5) * tileSize) - (viewportHeight / 2),
      0,
      maximumY,
    )),
  };
}

export function screenToWorld({
  screenX,
  screenY,
  displayWidth,
  displayHeight,
  canvasWidth,
  canvasHeight,
  camera,
  tileSize,
}) {
  const canvasX = screenX * (canvasWidth / displayWidth);
  const canvasY = screenY * (canvasHeight / displayHeight);
  return {
    x: Math.floor((canvasX + camera.x) / tileSize),
    y: Math.floor((canvasY + camera.y) / tileSize),
  };
}