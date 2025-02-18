import type { PostActionRunConfig, ActionResponse } from "api/ActionAPI";

export function checkForPostRunAction(actionResponse?: ActionResponse) {
  if (!actionResponse) {
    return false;
  }

  const { postRunAction } = actionResponse;

  if (
    postRunAction &&
    typeof postRunAction === "object" &&
    "type" in postRunAction
  ) {
    return true;
  }

  return false;
}

export function getPostRunActionName(postRunAction?: PostActionRunConfig) {
  if (!postRunAction) {
    return "";
  }

  const { name } = postRunAction;

  if (!name) {
    return "";
  }

  return name;
}
