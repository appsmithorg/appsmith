import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import { call, takeEvery, select, all } from "redux-saga/effects";
import { PageAction, ActionPayload } from "../constants/ActionConstants";
import ActionAPI, {
  ActionCreateUpdateResponse,
  ExecuteActionRequest,
} from "../api/ActionAPI";
import { AppState } from "../reducers";
import { JSONPath } from "jsonpath-plus";
import _ from "lodash";
import { mapToPropList } from "../utils/AppsmithUtils";

const getDataTree = (state: AppState) => {
  return state.entities;
};

const getAction = (
  state: AppState,
  actionId: string,
): ActionCreateUpdateResponse => {
  return state.entities.actions[actionId];
};

export function* evaluateJSONPathSaga(jsonPath: string): any {
  const dataTree = yield select(getDataTree);
  const result = JSONPath({ path: jsonPath, json: dataTree });
  return result;
}

export function* executeAPIQueryActionSaga(apiAction: ActionPayload) {
  const api: PageAction = yield select(getAction, apiAction.actionId);

  const executeActionRequest: ExecuteActionRequest = {
    actionId: apiAction.actionId,
  };
  if (!_.isNil(api.dynamicBindings)) {
    const responses: any = yield all(
      api.dynamicBindings.map((jsonPath: string) => {
        return call(evaluateJSONPathSaga, jsonPath);
      }),
    );
    const dynamicBindingMap: Record<string, any> = _.keyBy(
      responses,
      (response: string, index: number) => {
        return api.dynamicBindings ? api.dynamicBindings[index] : undefined;
      },
    );
    executeActionRequest.dynamicBindingList = mapToPropList(dynamicBindingMap);
  }
  yield ActionAPI.executeAction(executeActionRequest);
}

export function* executeActionSaga(action: ReduxAction<ActionPayload[]>) {
  if (!_.isNil(action.payload)) {
    yield all(
      _.map(action.payload, (actionPayload: ActionPayload) => {
        switch (actionPayload.actionType) {
          case "API":
            return call(executeAPIQueryActionSaga, actionPayload);
          case "QUERY":
            return call(executeAPIQueryActionSaga, actionPayload);
        }
        return undefined;
      }),
    );
  }
}

export function* watchExecuteActionSaga() {
  yield takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeActionSaga);
}
