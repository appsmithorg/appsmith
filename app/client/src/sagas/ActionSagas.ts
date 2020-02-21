import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  all,
  call,
  put,
  select,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  EventType,
  ExecuteActionPayload,
  PageAction,
} from "constants/ActionConstants";
import ActionAPI, {
  ActionApiResponse,
  ActionCreateUpdateResponse,
  ActionResponse,
  ExecuteActionRequest,
  PaginationField,
  Property,
  RestAction,
} from "api/ActionAPI";
import { AppState } from "reducers";
import _ from "lodash";
import { mapToPropList } from "utils/AppsmithUtils";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { GenericApiResponse } from "api/ApiResponses";
import {
  copyActionError,
  copyActionSuccess,
  createActionSuccess,
  deleteActionSuccess,
  executeApiActionRequest,
  executeApiActionSuccess,
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
import { getFormData } from "selectors/formSelectors";
import { API_EDITOR_FORM_NAME } from "constants/forms";
import { executeAction, executeActionError } from "actions/widgetActions";
import { getParsedDataTree } from "selectors/dataTreeSelectors";
import { transformRestAction } from "transformers/RestActionTransformer";
import { getActionResponses } from "selectors/entitiesSelector";
import {
  ActionDescription,
  RunActionPayload,
} from "entities/DataTree/dataTreeFactory";
import {
  getCurrentApplicationId,
  getPageList,
} from "selectors/editorSelectors";
import history from "utils/history";
import {
  BUILDER_PAGE_URL,
  getApplicationViewerPageURL,
} from "constants/routes";
import { ToastType } from "react-toastify";

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
  const dynamicResult = getDynamicValue(`{{${path}}}`, tree);
  return dynamicResult.result;
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

// function* executeJSActionSaga(jsAction: ExecuteJSActionPayload) {
//   const tree = yield select(getParsedDataTree);
//   const result = JSExecutionManagerSingleton.evaluateSync(
//     jsAction.jsFunction,
//     tree,
//   );
//
//   yield put({
//     type: ReduxActionTypes.SAVE_JS_EXECUTION_RECORD,
//     payload: {
//       [jsAction.jsFunctionId]: result,
//     },
//   });
// }

export function* executeAPIQueryActionSaga(
  apiAction: RunActionPayload,
  event: EventType,
) {
  const { actionId, onSuccess, onError } = apiAction;
  try {
    yield put(executeApiActionRequest({ id: apiAction.actionId }));
    const api: RestAction = yield select(getAction, actionId);
    const params: Property[] = yield call(getActionParams, api.jsonPathKeys);
    const pagination =
      event === EventType.ON_NEXT_PAGE
        ? "NEXT"
        : event === EventType.ON_PREV_PAGE
        ? "PREV"
        : undefined;
    const executeActionRequest: ExecuteActionRequest = {
      action: { id: actionId },
      params,
      paginationField: pagination,
    };
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      executeActionRequest,
    );
    let payload = createActionResponse(response);
    if (response.responseMeta && response.responseMeta.error) {
      payload = createActionErrorResponse(response);
      if (onError) {
        yield put(
          executeAction({
            dynamicString: onError,
            event: {
              type: EventType.ON_ERROR,
            },
            responseData: payload,
          }),
        );
      }
      yield put(
        executeActionError({
          actionId,
          error: response.responseMeta.error,
        }),
      );
    } else {
      yield put(
        executeApiActionSuccess({ id: apiAction.actionId, response: payload }),
      );
      if (onSuccess) {
        yield put(
          executeAction({
            dynamicString: onSuccess,
            event: {
              type: EventType.ON_SUCCESS,
            },
            responseData: payload,
          }),
        );
      }
    }
    return response;
  } catch (error) {
    yield put(
      executeActionError({
        actionId: actionId,
        error,
      }),
    );
    if (onError) {
      yield put(
        executeAction({
          dynamicString: `{{${onError}}}`,
          event: {
            type: EventType.ON_ERROR,
          },
          responseData: {},
        }),
      );
    }
  }
}

function* navigateActionSaga(action: { pageName: string }, event: EventType) {
  const pageList = yield select(getPageList);
  const applicationId = yield select(getCurrentApplicationId);
  const page = _.find(pageList, { pageName: action.pageName });
  if (page) {
    // TODO need to make this check via RENDER_MODE;
    const path = history.location.pathname.endsWith("/edit")
      ? BUILDER_PAGE_URL(applicationId, page.pageId)
      : getApplicationViewerPageURL(applicationId, page.pageId);
    history.push(path);
  }
}

export function* executeActionTriggers(
  trigger: ActionDescription<any>,
  event: EventType,
) {
  switch (trigger.type) {
    case "RUN_ACTION":
      yield call(executeAPIQueryActionSaga, trigger.payload, event);
      break;
    case "NAVIGATE_TO":
      yield call(navigateActionSaga, trigger.payload, event);
      break;
    case "NAVIGATE_TO_URL":
      if (trigger.payload.url) {
        window.location.href = trigger.payload.url;
      }
      break;
    case "SHOW_ALERT":
      AppToaster.show({
        message: trigger.payload.message,
        type: trigger.payload.style,
      });
      break;
    default:
      yield put(
        executeActionError({
          error: "Trigger type unknown",
          actionId: "",
        }),
      );
  }
}

export function* executeAppAction(action: ReduxAction<ExecuteActionPayload>) {
  const { dynamicString, event, responseData } = action.payload;
  const tree = yield select(getParsedDataTree);
  const { triggers } = getDynamicValue(dynamicString, tree, responseData, true);
  if (triggers) {
    yield all(
      triggers.map(trigger => call(executeActionTriggers, trigger, event.type)),
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
        type: ToastType.SUCCESS,
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
        type: ToastType.SUCCESS,
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
        type: ToastType.SUCCESS,
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
  const actionPayloads: RunActionPayload[][] = pageActions.map(actionSet =>
    actionSet.map(action => ({
      actionId: action.id,
      onSuccess: "",
      onError: "",
    })),
  );
  for (const actionSet of actionPayloads) {
    const apiResponses = yield select(getActionResponses);
    const filteredSet = actionSet.filter(
      action => !apiResponses[action.actionId],
    );
    yield* yield all(
      filteredSet.map(a =>
        call(executeAPIQueryActionSaga, a, EventType.ON_PAGE_LOAD),
      ),
    );
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
        type: ToastType.SUCCESS,
      });
    }
    yield put(moveActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while moving action ${actionObject.name}`,
      type: ToastType.ERROR,
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
        type: ToastType.SUCCESS,
      });
    }
    yield put(copyActionSuccess(response.data));
  } catch (e) {
    AppToaster.show({
      message: `Error while copying action ${actionObject.name}`,
      type: ToastType.ERROR,
    });
    yield put(copyActionError(action.payload));
  }
}

export function* watchActionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.FETCH_ACTIONS_INIT, fetchActionsSaga),
    takeLatest(ReduxActionTypes.EXECUTE_ACTION, executeAppAction),
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
