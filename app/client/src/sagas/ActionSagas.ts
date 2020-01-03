import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { Intent } from "@blueprintjs/core";
import {
  all,
  call,
  select,
  put,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  ActionPayload,
  PageAction,
  ExecuteJSActionPayload,
} from "constants/ActionConstants";
import ActionAPI, {
  ActionApiResponse,
  ActionCreateUpdateResponse,
  ActionResponse,
  ExecuteActionRequest,
  Property,
  RestAction,
} from "api/ActionAPI";
import { AppState, DataTree } from "reducers";
import _ from "lodash";
import { mapToPropList } from "utils/AppsmithUtils";
import AppToaster from "components/editorComponents/ToastComponent";
import { GenericApiResponse } from "api/ApiResponses";
import {
  createActionSuccess,
  deleteActionSuccess,
  FetchActionsPayload,
  runApiAction,
  updateActionSuccess,
} from "actions/actionActions";
import {
  getDynamicBindings,
  getDynamicValue,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import { getDataTree } from "selectors/entitiesSelector";
import {
  ERROR_MESSAGE_SELECT_ACTION,
  ERROR_MESSAGE_SELECT_ACTION_TYPE,
} from "constants/messages";
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { executeAction } from "actions/widgetActions";
import JSExecutionManagerSingleton from "jsExecution/JSExecutionManagerSingleton";
import {
  getNameBindingsWithData,
  NameBindingsWithData,
} from "selectors/nameBindingsWithDataSelector";
import { transformRestAction } from "transformers/RestActionTransformer";

export const getAction = (
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

export function* evaluateDynamicBoundValueSaga(path: string): any {
  const nameBindingsWithData = yield select(getNameBindingsWithData);
  return getDynamicValue(`{{${path}}}`, nameBindingsWithData);
}

export function* getActionParams(jsonPathKeys: string[] | undefined) {
  if (_.isNil(jsonPathKeys)) return [];
  const values: any = _.flatten(
    yield all(
      jsonPathKeys.map((jsonPath: string) => {
        return call(evaluateDynamicBoundValueSaga, jsonPath);
      }),
    ),
  );
  const dynamicBindings: Record<string, string> = {};
  jsonPathKeys.forEach((key, i) => {
    let value = values[i];
    if (typeof value === "object") value = JSON.stringify(value);
    dynamicBindings[key] = value;
  });
  return mapToPropList(dynamicBindings);
}

function* executeJSActionSaga(jsAction: ExecuteJSActionPayload) {
  const nameBindingsWithData: NameBindingsWithData = yield select(
    getNameBindingsWithData,
  );
  const result = JSExecutionManagerSingleton.evaluateSync(
    jsAction.jsFunction,
    nameBindingsWithData,
  );

  yield put({
    type: ReduxActionTypes.SAVE_JS_EXECUTION_RECORD,
    payload: {
      [jsAction.jsFunctionId]: result,
    },
  });
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
    const params: Property[] = yield call(getActionParams, api.jsonPathKeys);
    const executeActionRequest: ExecuteActionRequest = {
      action: { id: apiAction.actionId },
      params,
    };
    const dataTree: DataTree = yield select(getDataTree);
    yield put({
      type: ReduxActionTypes.WIDGETS_LOADING,
      payload: {
        widgetIds:
          dataTree.actions.actionToWidgetIdMap[apiAction.actionId] || [],
        areLoading: true,
      },
    });
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      executeActionRequest,
    );
    yield put({
      type: ReduxActionTypes.WIDGETS_LOADING,
      payload: {
        widgetIds:
          dataTree.actions.actionToWidgetIdMap[apiAction.actionId] || [],
        areLoading: false,
      },
    });
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
        case "JS_FUNCTION":
          return call(
            executeJSActionSaga,
            actionPayload as ExecuteJSActionPayload,
          );
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
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.CREATE_ACTION_ERROR,
      payload: { error },
    });
  }
}

export function* fetchActionsSaga(action: ReduxAction<FetchActionsPayload>) {
  try {
    const { pageId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield ActionAPI.fetchActions(
      pageId,
    );
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
    const { data } = actionPayload.payload;
    const action = transformRestAction(data);
    const response: GenericApiResponse<RestAction> = yield ActionAPI.updateAPI(
      action,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionPayload.payload.data.name} Action updated`,
        intent: Intent.SUCCESS,
      });
      yield put(updateActionSuccess({ data: response.data }));
      yield put(runApiAction(data.id));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.UPDATE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.data.id },
    });
  }
}

export function* deleteActionSaga(actionPayload: ReduxAction<{ id: string }>) {
  try {
    const id = actionPayload.payload.id;
    const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        intent: Intent.SUCCESS,
      });
      yield put(deleteActionSuccess({ id }));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.DELETE_ACTION_ERROR,
      payload: { error, id: actionPayload.payload.id },
    });
  }
}

export function* runApiActionSaga(action: ReduxAction<string>) {
  try {
    const {
      values,
      dirty,
      valid,
    }: { values: RestAction; dirty: boolean; valid: boolean } = yield select(
      getFormData,
      API_EDITOR_FORM_NAME,
    );
    const actionObject: PageAction = yield select(getAction, values.id);
    let action: ExecuteActionRequest["action"] = { id: values.id };
    let jsonPathKeys = actionObject.jsonPathKeys;
    if (!valid) {
      console.error("Form error");
      return;
    }
    if (dirty) {
      action = _.omit(transformRestAction(values), "id");
      const actionString = JSON.stringify(action);
      if (isDynamicValue(actionString)) {
        const { paths } = getDynamicBindings(actionString);
        // Replace cause the existing keys could have been updated
        jsonPathKeys = paths.filter(path => !!path);
      } else {
        jsonPathKeys = [];
      }
    }
    const params = yield call(getActionParams, jsonPathKeys);
    const response: ActionApiResponse = yield ActionAPI.executeAction({
      action,
      params,
    });
    let payload = createActionResponse(response);
    if (response.responseMeta && response.responseMeta.error) {
      payload = createActionErrorResponse(response);
    }
    const id = values.id || "DRY_RUN";
    yield put({
      type: ReduxActionTypes.RUN_API_SUCCESS,
      payload: { [id]: payload },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.RUN_API_ERROR,
      payload: { error, id: action.payload },
    });
  }
}

function* executePageLoadActionsSaga(action: ReduxAction<PageAction[]>) {
  const pageActions = action.payload;
  const apiResponses = yield select(
    (state: AppState) => state.entities.apiData,
  );
  const actionPayloads: ActionPayload[] = pageActions
    .filter(action => !(action.id in apiResponses))
    .map(action => ({
      actionId: action.id,
      actionType: action.pluginType,
      contextParams: {},
      actionName: action.name,
    }));
  if (actionPayloads.length) {
    yield put(executeAction(actionPayloads));
  }
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeLatest(ReduxActionTypes.EXECUTE_ACTION, executeReduxActionSaga),
    takeLatest(ReduxActionTypes.RUN_API_REQUEST, runApiActionSaga),
    takeLatest(ReduxActionTypes.CREATE_ACTION_INIT, createActionSaga),
    takeLatest(ReduxActionTypes.UPDATE_ACTION_INIT, updateActionSaga),
    takeLatest(ReduxActionTypes.DELETE_ACTION_INIT, deleteActionSaga),
    takeLatest(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
      executePageLoadActionsSaga,
    ),
  ]);
}
