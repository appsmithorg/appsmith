import type { Action } from "entities/Action";

export function getIsActionCreatedInApp(action: Action) {
  return !!action;
}
