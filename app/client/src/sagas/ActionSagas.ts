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
import { ActionPayload, PageAction } from "../constants/ActionConstants";
import ActionAPI, {
  ActionApiResponse,
  ActionCreateUpdateResponse,
  ActionResponse,
  ExecuteActionRequest,
  RestAction,
} from "../api/ActionAPI";
import { AppState, DataTree } from "../reducers";
import _ from "lodash";
import { mapToPropList } from "../utils/AppsmithUtils";
import AppToaster from "../components/editorComponents/ToastComponent";
import { GenericApiResponse } from "../api/ApiResponses";
import {
  createActionSuccess,
  deleteActionSuccess,
  updateActionSuccess,
} from "../actions/actionActions";
import { API_EDITOR_ID_URL, API_EDITOR_URL } from "../constants/routes";
import { getDynamicBoundValue } from "../utils/DynamicBindingUtils";
import history from "../utils/history";
import { validateResponse } from "./ErrorSagas";
import {
  ERROR_MESSAGE_SELECT_ACTION,
  ERROR_MESSAGE_SELECT_ACTION_TYPE,
} from "constants/messages";

const getDataTree = (state: AppState): DataTree => {
  return state.entities;
};

const getAction = (
  state: AppState,
  actionId: string,
): RestAction | undefined => {
  return _.find(state.entities.actions.data, { id: actionId });
};

const createActionResponse = (response: ActionApiResponse): ActionResponse => ({
  ...response.data,
  ...response.clientMeta,
});

const createActionErrorResponse = (
  response: ActionApiResponse,
): ActionResponse => ({
  body: response.responseMeta.error || { error: "Error" },
  statusCode: response.responseMeta.error
    ? response.responseMeta.error.code
    : "Error",
  headers: {},
  duration: "0",
  size: "0",
});

export function* evaluateJSONPathSaga(path: string): any {
  const dataTree = yield select(getDataTree);
  return getDynamicBoundValue(dataTree, path);
}

export function* executeAPIQueryActionSaga(apiAction: ActionPayload) {
  try {
    const api: PageAction = yield select(getAction, apiAction.actionId);
    if (!api) {
      yield put({
        type: ReduxActionTypes.EXECUTE_ACTION_ERROR,
        payload: "No action selected",
      });
      return;
    }

    const executeActionRequest: ExecuteActionRequest = {
      action: {
        id: apiAction.actionId,
      },
    };
    if (!_.isNil(api.jsonPathKeys)) {
      const values: any = _.flatten(
        yield all(
          api.jsonPathKeys.map((jsonPath: string) => {
            return call(evaluateJSONPathSaga, jsonPath);
          }),
        ),
      );
      const dynamicBindings: Record<string, string> = {};
      api.jsonPathKeys.forEach((key, i) => {
        dynamicBindings[key] = values[i];
      });
      executeActionRequest.params = mapToPropList(dynamicBindings);
    }
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      executeActionRequest,
    );
    let payload = createActionResponse(response);
    if (response.responseMeta && response.responseMeta.error) {
      payload = createActionErrorResponse(response);
      if (apiAction.onError) {
        yield put({
          type: ReduxActionTypes.EXECUTE_ACTION,
          payload: apiAction.onError,
        });
      }
      yield put({
        type: ReduxActionTypes.EXECUTE_ACTION_ERROR,
        payload: { [apiAction.actionId]: payload },
      });
    } else {
      if (apiAction.onSuccess) {
        yield put({
          type: ReduxActionTypes.EXECUTE_ACTION,
          payload: apiAction.onSuccess,
        });
      }
      yield put({
        type: ReduxActionTypes.EXECUTE_ACTION_SUCCESS,
        payload: { [apiAction.actionId]: payload },
      });
    }
    return response;
  } catch (error) {
    yield put({
      type: ReduxActionTypes.EXECUTE_ACTION_ERROR,
      payload: { error },
    });
  }
}

function validateActionPayload(actionPayload: ActionPayload) {
  const validation = {
    isValid: true,
    messages: [] as string[],
  };

  const noActionId = actionPayload.actionId === undefined;
  validation.isValid = validation.isValid && !noActionId;
  if (noActionId) {
    validation.messages.push(ERROR_MESSAGE_SELECT_ACTION);
  }

  const noActionType = actionPayload.actionType === undefined;
  validation.isValid = validation.isValid && !noActionType;
  if (noActionType) {
    validation.messages.push(ERROR_MESSAGE_SELECT_ACTION_TYPE);
  }
  return validation;
}

export function* executeActionSaga(actionPayloads: ActionPayload[]): any {
  yield all(
    _.map(actionPayloads, (actionPayload: ActionPayload) => {
      const actionValidation = validateActionPayload(actionPayload);
      if (!actionValidation.isValid) {
        console.error(actionValidation.messages.join(", "));
        return undefined;
      }

      switch (actionPayload.actionType) {
        case "API":
          return call(executeAPIQueryActionSaga, actionPayload);
        case "QUERY":
          return call(executeAPIQueryActionSaga, actionPayload);
        default:
          return undefined;
      }
    }),
  );
}

export function* executeReduxActionSaga(action: ReduxAction<ActionPayload[]>) {
  if (!_.isNil(action.payload)) {
    yield call(executeActionSaga, action.payload);
  } else {
    yield put({
      type: ReduxActionTypes.EXECUTE_ACTION_ERROR,
      payload: "No action payload",
    });
  }
}

function* dryRunActionSaga(action: ReduxAction<RestAction>) {
  const executeActionRequest: ExecuteActionRequest = {
    action: {
      ...action.payload,
    },
  };
  // TODO(hetu): No support for dynamic bindings in dry runs yet
  const response: ActionApiResponse = yield ActionAPI.executeAction(
    executeActionRequest,
  );
  let payload = createActionResponse(response);
  if (response.responseMeta && response.responseMeta.error) {
    payload = createActionErrorResponse(response);
  }
  yield put({
    type: ReduxActionTypes.EXECUTE_ACTION_SUCCESS,
    payload: { [action.type]: payload },
  });
}

export function* createActionSaga(actionPayload: ReduxAction<RestAction>) {
  try {
    const response: ActionCreateUpdateResponse = yield ActionAPI.createAPI(
      actionPayload.payload,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionPayload.payload.name} Action created`,
        intent: Intent.SUCCESS,
      });
      yield put(createActionSuccess(response.data));
      history.push(API_EDITOR_ID_URL(response.data.id));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsSaga() {
  try {
    const response: GenericApiResponse<
      RestAction[]
    > = yield ActionAPI.fetchActions();
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put({
        type: ReduxActionTypes.FETCH_ACTIONS_SUCCESS,
        payload: response.data,
      });
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_ERROR,
      payload: { error },
    });
  }
}

export function* updateActionSaga(
  actionPayload: ReduxAction<{ data: RestAction }>,
) {
  try {
    const response: GenericApiResponse<RestAction> = yield ActionAPI.updateAPI(
      actionPayload.payload.data,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionPayload.payload.data.name} Action updated`,
        intent: Intent.SUCCESS,
      });
      yield put(updateActionSuccess({ data: response.data }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error },
    });
  }
}

export function* deleteActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    const id = actionPayload.payload.id;
    const response: GenericApiResponse<
      RestAction
    > = yield ActionAPI.deleteAction(id);
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        intent: Intent.SUCCESS,
      });
      yield put(deleteActionSuccess({ id }));
      history.push(API_EDITOR_URL);
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error },
    });
  }
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeLatest(ReduxActionTypes.EXECUTE_ACTION, executeReduxActionSaga),
    takeLatest(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(ReduxActionTypes.DRY_RUN_ACTION, dryRunActionSaga),
  ]);
}
