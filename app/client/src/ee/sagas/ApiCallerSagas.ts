export * from "ce/sagas/ApiCallerSagas";
import { call } from "redux-saga/effects";
import ModuleApi from "@appsmith/api/ModuleApi";
import { updateActionAPICall as CE_updateActionAPICall } from "ce/sagas/ApiCallerSagas";
import type { ApiResponse } from "api/ApiResponses";
import type { Action } from "entities/Action";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";

export function* updateActionAPICall(action: Action) {
  try {
    if (action.pageId || action.workflowId) {
      const response: ApiResponse<Action> = yield call(
        CE_updateActionAPICall,
        action,
      );

      return response;
    } else {
      const response: ApiResponse<Action> = yield ModuleApi.updateAction({
        ...action,
        type: ENTITY_TYPE.ACTION,
      } as unknown as Action);

      return response;
    }
  } catch (e) {
    throw e;
  }
}
