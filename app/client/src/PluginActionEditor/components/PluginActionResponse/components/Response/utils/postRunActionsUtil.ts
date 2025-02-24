import type { PostActionRunConfig } from "api/types";

export function checkForPostRunAction(postRunAction?: PostActionRunConfig) {
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
