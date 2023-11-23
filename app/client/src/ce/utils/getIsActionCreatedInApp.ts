import type { Action } from "entities/Action";

export default function getIsActionCreatedInApp(action: Action) {
  return !!action;
}
