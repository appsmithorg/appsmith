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
  take,
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
  PaginationField,
} from "api/ActionAPI";
import { AppState } from "reducers";
import _ from "lodash";
import { mapToPropList } from "utils/AppsmithUtils";
import AppToaster from "components/editorComponents/ToastComponent";
import { GenericApiResponse } from "api/ApiResponses";
import {
  copyActionError,
  copyActionSuccess,
  createActionSuccess,
  deleteActionSuccess,
  FetchActionsPayload,
  moveActionError,
  moveActionSuccess,
  runApiAction,
  updateActionSuccess,
} from "actions/actionActions";
import {
  getDynamicBindings,
  getDynamicValue,
  isDynamicValue,
  removeBindingsFromObject,
} from "utils/DynamicBindingUtils";
import { validateResponse } from "./ErrorSagas";
import {
  ERROR_MESSAGE_SELECT_ACTION,
  ERROR_MESSAGE_SELECT_ACTION_TYPE,
} from "constants/messages";
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { executeAction, executeActionError } from "actions/widgetActions";
import JSExecutionManagerSingleton from "jsExecution/JSExecutionManagerSingleton";
import { getParsedDataTree } from "selectors/nameBindingsWithDataSelector";
import { transformRestAction } from "transformers/RestActionTransformer";
import { getActionResponses } from "selectors/entitiesSelector";

export const getAction = (
  state: AppState,
  actionId: string,
): RestAction | undefined => {
  const action = _.find(state.entities.actions, a => a.config.id === actionId);
  return action ? action.config : undefined;
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
  const tree = yield select(getParsedDataTree);
  return getDynamicValue(`{{${path}}}`, tree);
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
  const tree = yield select(getParsedDataTree);
  const result = JSExecutionManagerSingleton.evaluateSync(
    jsAction.jsFunction,
    tree,
  );

  yield put({
    type: ReduxActionTypes.SAVE_JS_EXECUTION_RECORD,
    payload: {
      [jsAction.jsFunctionId]: result,
    },
  });
}

export function* executeAPIQueryActionSaga(
  apiAction: ActionPayload,
  paginationField: PaginationField,
) {
  try {
    const api: PageAction = yield select(getAction, apiAction.actionId);
    if (!api) {
      yield put(
        executeActionError({
          actionId: apiAction.actionId,
          error: "No action selected",
        }),
      );
      return;
    }
    const params: Property[] = yield call(getActionParams, api.jsonPathKeys);
    const executeActionRequest: ExecuteActionRequest = {
      action: { id: apiAction.actionId },
      params,
      paginationField: paginationField,
    };
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
      yield put(
        executeActionError({
          actionId: apiAction.actionId,
          error: response.responseMeta.error,
        }),
      );
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
    yield put(
      executeActionError({
        actionId: apiAction.actionId,
        error,
      }),
    );
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

export function* executeActionSaga(
  actionPayloads: ActionPayload[],
  paginationField: PaginationField,
): any {
  yield all(
    _.map(actionPayloads, (actionPayload: ActionPayload) => {
      const actionValidation = validateActionPayload(actionPayload);
      if (!actionValidation.isValid) {
        console.error(actionValidation.messages.join(", "));
        return undefined;
      }

      switch (actionPayload.actionType) {
        case "API":
          return call(
            executeAPIQueryActionSaga,
            actionPayload,
            paginationField,
          );
        case "QUERY":
          return call(
            executeAPIQueryActionSaga,
            actionPayload,
            paginationField,
          );
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

export function* executeReduxActionSaga(
  action: ReduxAction<{
    actions: ActionPayload[];
    paginationField: PaginationField;
  }>,
) {
  if (!_.isNil(action.payload)) {
    yield* executeActionSaga(
      action.payload.actions,
      action.payload.paginationField,
    );
  } else {
    yield put(
      executeActionError({
        actionId: "",
        error: "No action payload",
      }),
    );
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
      payload: actionPayload.payload,
    });
  }
}

export function* fetchActionsSaga(action: ReduxAction<FetchActionsPayload>) {
  try {
    const { applicationId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield ActionAPI.fetchActions(
      applicationId,
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

export function* runApiActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField: PaginationField;
  }>,
) {
  try {
    const {
      values,
      dirty,
      valid,
    }: {
      values: RestAction;
      dirty: boolean;
      valid: boolean;
    } = yield select(getFormData, API_EDITOR_FORM_NAME);
    const actionObject: PageAction = yield select(getAction, values.id);
    let action: ExecuteActionRequest["action"] = { id: values.id };
    let jsonPathKeys = actionObject.jsonPathKeys;
    if (!valid) {
      console.error("Form error");
      return;
    }
    if (dirty) {
      action = _.omit(transformRestAction(values), "id") as RestAction;

      const actionString = JSON.stringify(action);
      if (isDynamicValue(actionString)) {
        const { paths } = getDynamicBindings(actionString);
        // Replace cause the existing keys could have been updated
        jsonPathKeys = paths.filter(path => !!path);
      } else {
        jsonPathKeys = [];
      }
    }
    const { paginationField } = reduxAction.payload;

    const params = yield call(getActionParams, jsonPathKeys);
    const response: ActionApiResponse = yield ActionAPI.executeAction({
      action,
      params,
      paginationField,
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
      payload: { error, id: reduxAction.payload },
    });
  }
}

function* executePageLoadActionsSaga(action: ReduxAction<PageAction[][]>) {
  const pageActions = action.payload;
  const actionPayloads: ActionPayload[][] = pageActions.map(actionSet =>
    actionSet.map(action => ({
      actionId: action.id,
      actionType: action.pluginType,
      contextParams: {},
      actionName: action.name,
    })),
  );
  for (const actionSet of actionPayloads) {
    const apiResponses = yield select(getActionResponses);
    const filteredSet = actionSet.filter(
      action => !apiResponses[action.actionId],
    );
    yield put(executeAction(filteredSet));
    for (const {} of filteredSet) {
      yield take(ReduxActionTypes.EXECUTE_ACTION_SUCCESS);
    }
  }
}

function* moveActionSaga(
  action: ReduxAction<{
    id: string;
    destinationPageId: string;
    originalPageId: string;
    name: string;
  }>,
) {
  const drafts = yield select(state => state.ui.apiPane.drafts);
  const dirty = action.payload.id in drafts;
  const actionObject: RestAction = dirty
    ? drafts[action.payload.id]
    : yield select(getAction, action.payload.id);
  const withoutBindings = removeBindingsFromObject(actionObject);
  try {
    const response = yield ActionAPI.moveAction({
      action: {
        ...withoutBindings,
        name: action.payload.name,
      },
      destinationPageId: action.payload.destinationPageId,
    });

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action moved`,
        intent: Intent.SUCCESS,
      });
    }
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while moving action ${actionObject.name}`,
      intent: Intent.DANGER,
    });
    yield put(
      moveActionError({
        id: action.payload.id,
        originalPageId: action.payload.originalPageId,
      }),
    );
  }
}

function* copyActionSaga(
  action: ReduxAction<{ id: string; destinationPageId: string; name: string }>,
) {
  const drafts = yield select(state => state.ui.apiPane.drafts);
  const dirty = action.payload.id in drafts;
  let actionObject = dirty
    ? drafts[action.payload.id]
    : yield select(getAction, action.payload.id);
  if (action.payload.destinationPageId !== actionObject.pageId) {
    actionObject = removeBindingsFromObject(actionObject);
  }
  try {
    const copyAction = {
      ...(_.omit(actionObject, "id") as RestAction),
      name: action.payload.name,
      pageId: action.payload.destinationPageId,
    };
    const response = yield ActionAPI.createAPI(copyAction);

    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${actionObject.name} Action copied`,
        intent: Intent.SUCCESS,
      });
    }
    yield put(copyActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while copying action ${actionObject.name}`,
      intent: Intent.DANGER,
    });
    yield put(copyActionError(action.payload));
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
    takeLatest(ReduxActionTypes.MOVE_ACTION_INIT, moveActionSaga),
    takeLatest(ReduxActionTypes.COPY_ACTION_INIT, copyActionSaga),
  ]);
}
