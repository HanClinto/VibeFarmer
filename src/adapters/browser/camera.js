function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function cameraAxis(focus, worldTiles, viewportPixels, tileSize) {
  const worldPixels = worldTiles * tileSize;
  if (worldPixels < viewportPixels) return -Math.round((viewportPixels - worldPixels) / 2);
  return Math.round(clamp(
    ((focus + 0.5) * tileSize) - (viewportPixels / 2),
    0,
    worldPixels - viewportPixels,
  ));
}

export function computeCamera({
  focus,
  worldWidth,
  worldHeight,
  viewportWidth,
  viewportHeight,
  tileSize,
}) {
  return {
    x: cameraAxis(focus.x, worldWidth, viewportWidth, tileSize),
    y: cameraAxis(focus.y, worldHeight, viewportHeight, tileSize),
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