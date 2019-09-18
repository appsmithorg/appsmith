import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import { call, takeEvery, select, all } from "redux-saga/effects";
import {
  APIActionPayload,
  QueryActionPayload,
  PageAction,
  ActionPayload,
} from "../constants/ActionConstants";
import ActionAPI, { ActionCreateUpdateResponse } from "../api/ActionAPI";
import { AppState } from "../reducers";
import { JSONPath } from "jsonpath-plus";
import _ from "lodash";

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

export function* executeAPIActionSaga(apiAction: APIActionPayload) {
  const api: PageAction = yield select(getAction, apiAction.apiId);
  const responses: any = yield all(
    api.dynamicBindings.map((jsonPath: string) => {
      return call(evaluateJSONPathSaga, jsonPath);
    }),
  );
  const dynamicBindingMap: Record<string, any> = _.keyBy(
    responses,
    (response: string, index: number) => {
      return api.dynamicBindings[index];
    },
  );
  yield ActionAPI.executeAction({
    actionId: apiAction.apiId,
    dynamicBindingMap: dynamicBindingMap,
  });
}

export function* executeQueryActionSaga(queryAction: QueryActionPayload) {
  const query: PageAction = yield select(getAction, queryAction.queryId);
  const responses: any = yield all(
    query.dynamicBindings.map((jsonPath: string) => {
      return call(evaluateJSONPathSaga, jsonPath);
    }),
  );
  const dynamicBindingMap: Record<string, any> = _.keyBy(
    responses,
    (response: string, index: number) => {
      return query.dynamicBindings[index];
    },
  );
  yield ActionAPI.executeAction({
    actionId: query.actionId,
    dynamicBindingMap: dynamicBindingMap,
  });
}

export function* executeActionSaga(action: ReduxAction<ActionPayload[]>) {
  if (!_.isNil(action.payload)) {
    yield all(
      action.payload.map((actionPayload: ActionPayload) => {
        switch (actionPayload.actionType) {
          case "API":
            const apiActionPaylod: APIActionPayload = actionPayload as APIActionPayload;
            return call(executeAPIActionSaga, apiActionPaylod);
        }
        return undefined;
      }),
    );
  }
}

export function* watchExecuteActionSaga() {
  yield takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeActionSaga);
}
