import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "../constants/ReduxActionConstants";
import { Intent } from "@blueprintjs/core";
import {
  all,
  call,
  select,
  put,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { initialize } from "redux-form";
import { ActionPayload, PageAction } from "../constants/ActionConstants";
import ActionAPI, {
  ActionApiResponse,
  ActionCreateUpdateResponse,
  ExecuteActionRequest,
  RestAction,
} from "../api/ActionAPI";
import { AppState } from "../reducers";
import { JSONPath } from "jsonpath-plus";
import _ from "lodash";
import { mapToPropList } from "../utils/AppsmithUtils";
import AppToaster from "../components/editor/ToastComponent";
import { GenericApiResponse } from "../api/ApiResponses";
import { API_EDITOR_FORM_NAME } from "../constants/forms";
import {
  createActionSuccess,
  deleteActionSuccess,
  updateActionSuccess,
} from "../actions/actionActions";
import { API_EDITOR_ID_URL, API_EDITOR_URL } from "../constants/routes";
import history from "../utils/history";

const getDataTree = (state: AppState) => {
  return state.entities;
};

const getAction = (state: AppState, actionId: string): PageAction => {
  return state.entities.actions.list[actionId];
};

export function* evaluateJSONPathSaga(jsonPath: string): any {
  const dataTree = yield select(getDataTree);
  return JSONPath({ path: jsonPath, json: dataTree });
}

export function* executeAPIQueryActionSaga(apiAction: ActionPayload) {
  const api: PageAction = yield select(getAction, apiAction.actionId);

  const executeActionRequest: ExecuteActionRequest = {
    actionId: apiAction.actionId,
  };
  if (!_.isNil(api.jsonPathKeys)) {
    const responses: any = yield all(
      api.jsonPathKeys.map((jsonPath: string) => {
        return call(evaluateJSONPathSaga, jsonPath);
      }),
    );
    const dynamicBindingMap: Record<string, any> = _.keyBy(
      responses,
      (response: string, index: number) => {
        return api.jsonPathKeys ? api.jsonPathKeys[index] : undefined;
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

export function* createActionSaga(actionPayload: ReduxAction<RestAction>) {
  const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
    actionPayload.payload,
  );
  if (response.responseMeta.success) {
    AppToaster.show({
      message: `${actionPayload.payload.name} Action created`,
      intent: Intent.SUCCESS,
    });
    yield put(createActionSuccess(response.data));
    history.push(API_EDITOR_ID_URL(response.data.id));
  }
}

export function* fetchActionsSaga() {
  const response: GenericApiResponse<
    RestAction[]
  > = yield ActionAPI.fetchActions();
  if (response.responseMeta.success) {
    yield put({
      type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
      payload: response.data,
    });
  } else {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: response.responseMeta.status,
    });
  }
}

export function* fetchActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  const response: GenericApiResponse<RestAction> = yield ActionAPI.fetchAPI(
    actionPayload.payload.id,
  );
  const data = response.data;
  yield put(initialize(API_EDITOR_FORM_NAME, data));
}

export function* runActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  const id = actionPayload.payload.id;
  const response: ActionApiResponse = yield ActionAPI.executeAction({
    actionId: id,
  });

  let payload = response;
  if (response.responseMeta && response.responseMeta.error) {
    payload = {
      body: response.responseMeta.error,
      statusCode: response.responseMeta.error.code,
      ...response,
    };
  }
  yield put({
    type: ReduxActionTypes.RUN_ACTION_SUCCESS,
    payload: { [id]: payload },
  });
}

export function* updateActionSaga(
  actionPayload: ReduxAction<{ data: RestAction }>,
) {
  const finalFields: Partial<RestAction> = _.omit(
    actionPayload.payload.data,
    "new",
  );
  const response: GenericApiResponse<RestAction> = yield ActionAPI.updateAPI(
    finalFields,
  );
  if (response.responseMeta.success) {
    AppToaster.show({
      message: `${actionPayload.payload.data.name} Action updated`,
      intent: Intent.SUCCESS,
    });
    yield put(updateActionSuccess({ data: response.data }));
  } else {
    AppToaster.show({
      message: "Error occurred when updating action",
      intent: Intent.DANGER,
    });
  }
}

export function* deleteActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  const id = actionPayload.payload.id;
  const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
    id,
  );
  if (response.responseMeta.success) {
    AppToaster.show({
      message: `${response.data.name} Action deleted`,
      intent: Intent.SUCCESS,
    });
    yield put(deleteActionSuccess({ id }));
    history.push(API_EDITOR_URL);
  } else {
    AppToaster.show({
      message: "Error occurred when deleting action",
      intent: Intent.DANGER,
    });
  }
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeLatest(ReduxActionTypes.EXECUTE_ACTION, executeActionSaga),
    takeLatest(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeEvery(ReduxActionTypes.FETCH_ACTION, fetchActionSaga),
    takeLatest(ReduxActionTypes.RUN_ACTION_INIT, runActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
  ]);
}
