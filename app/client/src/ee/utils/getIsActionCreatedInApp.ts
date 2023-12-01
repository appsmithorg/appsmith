import type { Action } from "entities/Action";
export * from "ce/utils/getIsActionCreatedInApp";
import { getIsActionCreatedInApp as CE_getIsActionCreatedInApp } from "ce/utils/getIsActionCreatedInApp";

export function getIsActionCreatedInApp(action: Action) {
  return CE_getIsActionCreatedInApp(action) && !action.moduleInstanceId;
}
