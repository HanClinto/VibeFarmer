export function canvasSizeForStage(stageSize, minimumSize) {
  return {
    width: Math.max(minimumSize.width, Math.round(stageSize.width)),
    height: Math.max(minimumSize.height, Math.round(stageSize.height)),
  };
}