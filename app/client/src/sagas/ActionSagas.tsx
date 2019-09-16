import CanvasWidgetsNormalizer from "../normalizers/CanvasWidgetsNormalizer";
import {
  ReduxActionTypes,
  ReduxAction,
} from "../constants/ReduxActionConstants";
import PageApi, { PageResponse, PageRequest } from "../api/PageApi";
import { call, put, takeEvery, select, all } from "redux-saga/effects";
import { RenderModes } from "../constants/WidgetConstants";
import {
  APIActionPayload,
  QueryActionPayload,
  PageAction,
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

export function* evaluateJSONPath(jsonPath: string): any {
  const dataTree = yield select(getDataTree);
  const result = JSONPath({ path: jsonPath, json: dataTree });
  return result;
}

export function* executeAPIAction(apiAction: APIActionPayload) {
  const api: PageAction = yield select(getAction, apiAction.apiId);
  const responses: any = yield all(
    api.dynamicBindings.map((jsonPath: string) => {
      return call(evaluateJSONPath, jsonPath);
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

export function* executeQueryAction(queryAction: QueryActionPayload) {
  const query: PageAction = yield select(getAction, queryAction.queryId);
  const responses: any = yield all(
    query.dynamicBindings.map((jsonPath: string) => {
      return call(evaluateJSONPath, jsonPath);
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

export function* executeAction(pageRequestAction: ReduxAction<PageRequest>) {
  const pageRequest = pageRequestAction.payload;
  try {
    const pageResponse: PageResponse = yield call(
      PageApi.fetchPage,
      pageRequest,
    );
    if (pageRequest.renderMode === RenderModes.CANVAS) {
      const normalizedResponse = CanvasWidgetsNormalizer.normalize(
        pageResponse,
      );
      const payload = {
        pageWidgetId: normalizedResponse.result,
        widgets: normalizedResponse.entities.canvasWidgets,
      };
      yield put({ type: ReduxActionTypes.UPDATE_CANVAS, payload });
    }
  } catch (err) {
    //TODO(abhinav): REFACTOR THIS
  }
}

export function* watchExecuteAction() {
  yield takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeAction);
}
