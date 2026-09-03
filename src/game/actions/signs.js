import { getWorldEntity } from "../world/world.js";

function outcome(success, code, details = {}) {
  return { success, code, ...details };
}

export function updateSign(state, entityId, markdown) {
  const sign = getWorldEntity(state.world, entityId);
  if (sign?.type !== "sign") return outcome(false, "SIGN_NOT_FOUND");
  if (typeof markdown !== "string") return outcome(false, "INVALID_SIGN_MESSAGE");

  sign.markdown = markdown.slice(0, 2000);
  return outcome(true, "SIGN_UPDATED", { entityId, markdown: sign.markdown });
}