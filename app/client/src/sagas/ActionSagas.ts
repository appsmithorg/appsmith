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
  ExecuteActionPayloadEvent,
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
  fetchActionsForPageSuccess,
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
import { evaluateDataTree } from "selectors/dataTreeSelectors";
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
import AnalyticsUtil from "utils/AnalyticsUtil";

export const getAction = (
  state: AppState,
  actionId: string,
): RestAction | undefined => {
  const action = _.find(state.entities.actions, a => a.config.id === actionId);
  return action ? action.config : undefined;
};

const createActionSuccessResponse = (
  response: ActionApiResponse,
): ActionResponse => ({
  ...response.data,
  ...response.clientMeta,
});

const isErrorResponse = (response: ActionApiResponse) => {
  return (
    (response.responseMeta && response.responseMeta.error) ||
    !/2\d\d/.test(response.data.statusCode)
  );
};

function getCurrentPageNameByActionId(
  state: AppState,
  actionId: string,
): string {
  const action = state.entities.actions.find(action => {
    return action.config.id === actionId;
  });
  const pageId = action ? action.config.pageId : "";
  return getPageNameByPageId(state, pageId);
}

function getPageNameByPageId(state: AppState, pageId: string): string {
  const page = state.entities.pageList.pages.find(
    page => page.pageId === pageId,
  );
  return page ? page.pageName : "";
}

const createActionErrorResponse = (
  response: ActionApiResponse,
): ActionResponse => ({
  body: response.responseMeta.error || { error: "Error" },
  statusCode: response.responseMeta.error
    ? response.responseMeta.error.code.toString()
    : "Error",
  headers: {},
  duration: "0",
  size: "0",
});

export function* evaluateDynamicBoundValueSaga(path: string): any {
  const tree = yield select(evaluateDataTree);
  const dynamicResult = getDynamicValue(`{{${path}}}`, tree);
  return dynamicResult.result;
}

export function* getActionParams(jsonPathKeys: string[] | undefined) {
  if (_.isNil(jsonPathKeys)) return [];
  const values: any = yield all(
    jsonPathKeys.map((jsonPath: string) => {
      return call(evaluateDynamicBoundValueSaga, jsonPath);
    }),
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

export function* executeActionSaga(
  apiAction: RunActionPayload,
  event: ExecuteActionPayloadEvent,
) {
  const { actionId, onSuccess, onError } = apiAction;
  try {
    yield put(executeApiActionRequest({ id: apiAction.actionId }));
    const api: RestAction = yield select(getAction, actionId);
    const params: Property[] = yield call(getActionParams, api.jsonPathKeys);
    const pagination =
      event.type === EventType.ON_NEXT_PAGE
        ? "NEXT"
        : event.type === EventType.ON_PREV_PAGE
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
    if (isErrorResponse(response)) {
      const payload = createActionErrorResponse(response);
      if (onError) {
        yield put(
          executeAction({
            dynamicString: onError,
            event: {
              ...event,
              type: EventType.ON_ERROR,
            },
            responseData: payload,
          }),
        );
      } else {
        if (event.callback) {
          event.callback({ success: false });
        }
      }
      yield put(
        executeActionError({
          actionId,
          error: response.responseMeta.error,
        }),
      );
    } else {
      const payload = createActionSuccessResponse(response);
      yield put(
        executeApiActionSuccess({
          id: apiAction.actionId,
          response: payload,
        }),
      );
      if (onSuccess) {
        yield put(
          executeAction({
            dynamicString: onSuccess,
            event: {
              ...event,
              type: EventType.ON_SUCCESS,
            },
            responseData: payload,
          }),
        );
      } else {
        if (event.callback) {
          event.callback({ success: true });
        }
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
            ...event,
            type: EventType.ON_ERROR,
          },
          responseData: {},
        }),
      );
    } else {
      if (event.callback) {
        event.callback({ success: false });
      }
    }
  }
}

function* navigateActionSaga(
  action: { pageName: string },
  event: ExecuteActionPayloadEvent,
) {
  const pageList = yield select(getPageList);
  const applicationId = yield select(getCurrentApplicationId);
  const page = _.find(pageList, { pageName: action.pageName });
  if (page) {
    // TODO need to make this check via RENDER_MODE;
    const path = history.location.pathname.endsWith("/edit")
      ? BUILDER_PAGE_URL(applicationId, page.pageId)
      : getApplicationViewerPageURL(applicationId, page.pageId);
    history.push(path);
    if (event.callback) event.callback({ success: true });
  } else {
    if (event.callback) event.callback({ success: false });
  }
}

export function* executeActionTriggers(
  trigger: ActionDescription<any>,
  event: ExecuteActionPayloadEvent,
) {
  switch (trigger.type) {
    case "RUN_ACTION":
      yield call(executeActionSaga, trigger.payload, event);
      break;
    case "NAVIGATE_TO":
      AnalyticsUtil.logEvent("NAVIGATE", {
        pageName: trigger.payload.pageName,
      });
      yield call(navigateActionSaga, trigger.payload, event);
      break;
    case "NAVIGATE_TO_URL":
      if (trigger.payload.url) {
        AnalyticsUtil.logEvent("NAVIGATE", {
          navUrl: trigger.payload.url,
        });
        window.location.href = trigger.payload.url;
        if (event.callback) event.callback({ success: true });
      } else {
        if (event.callback) event.callback({ success: false });
      }
      break;
    case "SHOW_ALERT":
      AppToaster.show({
        message: trigger.payload.message,
        type: trigger.payload.style,
      });
      if (event.callback) event.callback({ success: true });
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
  const tree = yield select(evaluateDataTree);
  const { triggers } = getDynamicValue(dynamicString, tree, responseData, true);
  if (triggers && triggers.length) {
    yield all(
      triggers.map(trigger => call(executeActionTriggers, trigger, event)),
    );
  } else {
    if (event.callback) event.callback({ success: true });
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

      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("CREATE_API", {
        apiId: response.data.id,
        apiName: response.data.name,
        pageName: pageName,
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

export function* fetchActionsForPageSaga(
  action: ReduxAction<{ pageId: string }>,
) {
  try {
    const { pageId } = action.payload;
    const response: GenericApiResponse<RestAction[]> = yield call(
      ActionAPI.fetchActionsByPageId,
      pageId,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      yield put(fetchActionsForPageSuccess(response.data));
    }
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.FETCH_ACTIONS_FOR_PAGE_ERROR,
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

      const pageName = yield select(
        getCurrentPageNameByActionId,
        response.data.id,
      );

      AnalyticsUtil.logEvent("SAVE_API", {
        apiId: response.data.id,
        apiName: response.data.name,
        pageName: pageName,
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

export function* deleteActionSaga(
  actionPayload: ReduxAction<{ id: string; name: string }>,
) {
  try {
    const id = actionPayload.payload.id;
    const name = actionPayload.payload.name;
    const response: GenericApiResponse<RestAction> = yield ActionAPI.deleteAction(
      id,
    );
    const isValidResponse = yield validateResponse(response);
    if (isValidResponse) {
      AppToaster.show({
        message: `${response.data.name} Action deleted`,
        type: ToastType.SUCCESS,
      });
      const pageName = yield select(getCurrentPageNameByActionId, id);
      AnalyticsUtil.logEvent("DELETE_API", {
        apiName: name,
        pageName: pageName,
        apiID: id,
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
    let payload = createActionSuccessResponse(response);
    if (response.responseMeta && response.responseMeta.error) {
      payload = createActionErrorResponse(response);
    }
    const id = values.id || "DRY_RUN";

    const pageName = yield select(getCurrentPageNameByActionId, values.id);

    AnalyticsUtil.logEvent("RUN_API", {
      apiId: values.id,
      apiName: values.name,
      pageName: pageName,
      responseTime: response.clientMeta.duration,
      apiType: "INTERNAL",
    });

    yield put({
      type: ReduxActionTypes.RUN_API_SUCCESS,
      payload: { [id]: payload },
    });
  } catch (error) {
    yield put({
      type: ReduxActionErrorTypes.RUN_API_ERROR,
      payload: { error, id: reduxAction.payload.id },
    });
  }
}

function* executePageLoadAction(pageAction: PageAction) {
  yield put(executeApiActionRequest({ id: pageAction.id }));
  const params: Property[] = yield call(
    getActionParams,
    pageAction.jsonPathKeys,
  );
  const executeActionRequest: ExecuteActionRequest = {
    action: { id: pageAction.id },
    params,
  };
  const response: ActionApiResponse = yield ActionAPI.executeAction(
    executeActionRequest,
  );

  if (isErrorResponse(response)) {
    yield put(
      executeActionError({
        actionId: pageAction.id,
        error: response.responseMeta.error,
      }),
    );
  } else {
    const payload = createActionSuccessResponse(response);
    yield put(
      executeApiActionSuccess({
        id: pageAction.id,
        response: payload,
      }),
    );
  }
}

function* executePageLoadActionsSaga(action: ReduxAction<PageAction[][]>) {
  const pageActions = action.payload;
  for (const actionSet of pageActions) {
    const apiResponses = yield select(getActionResponses);
    const filteredSet = actionSet.filter(action => !apiResponses[action.id]);
    yield* yield all(filteredSet.map(a => call(executePageLoadAction, a)));
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
    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    AnalyticsUtil.logEvent("MOVE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
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

    const pageName = yield select(getPageNameByPageId, response.data.pageId);
    AnalyticsUtil.logEvent("DUPLICATE_API", {
      apiName: response.data.name,
      pageName: pageName,
      apiID: response.data.id,
    });
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
    takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeAppAction),
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
    takeLatest(
      ReduxActionTypes.FETCH_ACTIONS_FOR_PAGE_INIT,
      fetchActionsForPageSaga,
    ),
  ]);
}
