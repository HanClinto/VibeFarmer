export const TIRED_CUE_DURATION_MS = 2800;

export function actionFailureMessage(code, actorId = "player") {
  if (code === "NOT_ENOUGH_STAMINA") {
    return actorId === "robot"
      ? "Robot is out of stamina. Use its charging berth or a solar charging station."
      : "Too tired to work. Go home and sleep in your bed.";
  }
  return `Cannot act: ${code}`;
}