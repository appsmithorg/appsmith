import {
  ApplicationPayload,
  Page,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import {
  EventType,
  ExecuteActionPayload,
  ExecuteActionPayloadEvent,
  PageAction,
} from "constants/ActionConstants";
import * as log from "loglevel";
import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import { getDynamicBindings, isDynamicValue } from "utils/DynamicBindingUtils";
import {
  ActionDescription,
  RunActionPayload,
} from "entities/DataTree/dataTreeFactory";
import { executeAction, executeActionError } from "actions/widgetActions";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getPageList,
} from "selectors/editorSelectors";
import _ from "lodash";
import AnalyticsUtil from "utils/AnalyticsUtil";
import history from "utils/history";
import {
  BUILDER_PAGE_URL,
  convertToQueryParams,
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  executeApiActionRequest,
  executeApiActionSuccess,
  showRunActionConfirmModal,
  updateAction,
} from "actions/actionActions";
import { Action } from "entities/Action";
import ActionAPI, {
  ActionApiResponse,
  ActionResponse,
  ExecuteActionRequest,
  PaginationField,
  Property,
} from "api/ActionAPI";
import {
  getAction,
  getCurrentPageNameByActionId,
  isActionDirty,
  isActionSaving,
} from "selectors/entitiesSelector";
import { AppState } from "reducers";
import { mapToPropList } from "utils/AppsmithUtils";
import { validateResponse } from "sagas/ErrorSagas";
import { TypeOptions } from "react-toastify";
import { PLUGIN_TYPE_API } from "constants/ApiEditorConstants";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "constants/ApiConstants";
import { updateAppStore } from "actions/pageActions";
import { getAppStoreName } from "constants/AppConstants";
import downloadjs from "downloadjs";
import { getType, Types } from "utils/TypeHelpers";
import { Toaster } from "components/ads/Toast";
import { Variant } from "components/ads/common";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import {
  getAppMode,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import {
  evaluateDynamicTrigger,
  evaluateActionBindings,
} from "./EvaluationsSaga";
import copy from "copy-to-clipboard";
import {
  ACTION_RUN_SUCCESS,
  createMessage,
  ERROR_ACTION_EXECUTE_FAIL,
  ERROR_API_EXECUTE,
  ERROR_FAIL_ON_PAGE_LOAD_ACTIONS,
  ERROR_WIDGET_DOWNLOAD,
} from "constants/messages";
import { EMPTY_RESPONSE } from "../components/editorComponents/ApiResponseView";

import localStorage from "utils/localStorage";
import { getWidgetByName } from "./selectors";
import {
  resetChildrenMetaProperty,
  resetWidgetMetaProperty,
} from "actions/metaActions";

export enum NavigationTargetType {
  SAME_WINDOW = "SAME_WINDOW",
  NEW_WINDOW = "NEW_WINDOW",
}

const isValidUrlScheme = (url: string): boolean => {
  return (
    // Standard http call
    url.startsWith("http://") ||
    // Secure http call
    url.startsWith("https://") ||
    // Mail url to directly open email app prefilled
    url.startsWith("mailto:") ||
    // Tel url to directly open phone app prefilled
    url.startsWith("tel:")
  );
};

function* navigateActionSaga(
  action: {
    pageNameOrUrl: string;
    params: Record<string, string>;
    target?: NavigationTargetType;
  },
  event: ExecuteActionPayloadEvent,
) {
  const pageList = yield select(getPageList);
  const applicationId = yield select(getCurrentApplicationId);
  const {
    pageNameOrUrl,
    params,
    target = NavigationTargetType.SAME_WINDOW,
  } = action;
  const page = _.find(
    pageList,
    (page: Page) => page.pageName === pageNameOrUrl,
  );
  if (page) {
    AnalyticsUtil.logEvent("NAVIGATE", {
      pageName: pageNameOrUrl,
      pageParams: params,
    });
    const appMode = yield select(getAppMode);
    const path =
      appMode === APP_MODE.EDIT
        ? BUILDER_PAGE_URL(applicationId, page.pageId, params)
        : getApplicationViewerPageURL(applicationId, page.pageId, params);
    if (target === NavigationTargetType.SAME_WINDOW) {
      history.push(path);
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(path, "_blank");
    }
    if (event.callback) event.callback({ success: true });
  } else {
    AnalyticsUtil.logEvent("NAVIGATE", {
      navUrl: pageNameOrUrl,
    });
    let url = pageNameOrUrl + convertToQueryParams(params);
    // Add a default protocol if it doesn't exist.
    if (!isValidUrlScheme(url)) {
      url = "https://" + url;
    }
    if (target === NavigationTargetType.SAME_WINDOW) {
      window.location.assign(url);
    } else if (target === NavigationTargetType.NEW_WINDOW) {
      window.open(url, "_blank");
    }
    if (event.callback) event.callback({ success: true });
  }
}

function* storeValueLocally(
  action: { key: string; value: string },
  event: ExecuteActionPayloadEvent,
) {
  try {
    const appId = yield select(getCurrentApplicationId);
    const appStoreName = getAppStoreName(appId);
    const existingStore = yield localStorage.getItem(appStoreName) || "{}";
    const storeObj = JSON.parse(existingStore);
    storeObj[action.key] = action.value;
    const storeString = JSON.stringify(storeObj);
    yield localStorage.setItem(appStoreName, storeString);
    yield put(updateAppStore(storeObj));
    if (event.callback) event.callback({ success: true });
  } catch (err) {
    if (event.callback) event.callback({ success: false });
  }
}

async function downloadSaga(
  action: { data: any; name: string; type: string },
  event: ExecuteActionPayloadEvent,
) {
  try {
    const { data, name, type } = action;
    if (!name) {
      Toaster.show({
        text: createMessage(
          ERROR_WIDGET_DOWNLOAD,
          "File name was not provided",
        ),
        variant: Variant.danger,
      });

      if (event.callback) event.callback({ success: false });
      return;
    }
    const dataType = getType(data);
    if (dataType === Types.ARRAY || dataType === Types.OBJECT) {
      const jsonString = JSON.stringify(data, null, 2);
      downloadjs(jsonString, name, type);
    } else {
      downloadjs(data, name, type);
    }
    if (event.callback) event.callback({ success: true });
  } catch (err) {
    Toaster.show({
      text: createMessage(ERROR_WIDGET_DOWNLOAD, err),
      variant: Variant.danger,
    });
    if (event.callback) event.callback({ success: false });
  }
}

function* copySaga(
  payload: {
    data: string;
    options: { debug: boolean; format: string };
  },
  event: ExecuteActionPayloadEvent,
) {
  const result = copy(payload.data, payload.options);
  if (event.callback) {
    if (result) {
      event.callback({ success: result });
    }
  }
}

function* resetWidgetMetaByNameRecursiveSaga(
  payload: { widgetName: string; resetChildren: boolean },
  event: ExecuteActionPayloadEvent,
) {
  const fail = (msg: string) => {
    console.error(msg);
    if (event.callback) event.callback({ success: false });
  };
  if (typeof payload.widgetName !== "string") {
    return fail("widgetName needs to be a string");
  }

  const widget = yield select(getWidgetByName, payload.widgetName);
  if (!widget) {
    return fail(`widget ${payload.widgetName} not found`);
  }

  yield put(resetWidgetMetaProperty(widget.widgetId));
  if (payload.resetChildren) {
    yield put(resetChildrenMetaProperty(widget.widgetId));
  }
  if (event.callback) event.callback({ success: true });
}

function* showAlertSaga(
  payload: { message: string; style?: TypeOptions },
  event: ExecuteActionPayloadEvent,
) {
  if (typeof payload.message !== "string") {
    console.error("Toast message needs to be a string");
    if (event.callback) event.callback({ success: false });
    return;
  }
  let variant;
  switch (payload.style) {
    case "info":
      variant = Variant.info;
      break;
    case "success":
      variant = Variant.success;
      break;
    case "warning":
      variant = Variant.warning;
      break;
    case "error":
      variant = Variant.danger;
      break;
  }
  if (payload.style && !variant) {
    console.error(
      "Toast type needs to be a one of " + Object.values(Variant).join(", "),
    );
    if (event.callback) event.callback({ success: false });
    return;
  }
  Toaster.show({
    text: payload.message,
    variant: variant,
  });
  if (event.callback) event.callback({ success: true });
}

export const getActionTimeout = (
  state: AppState,
  actionId: string,
): number | undefined => {
  const action = _.find(
    state.entities.actions,
    (a) => a.config.id === actionId,
  );
  if (action) {
    const timeout = _.get(
      action,
      "config.actionConfiguration.timeoutInMillisecond",
      DEFAULT_EXECUTE_ACTION_TIMEOUT_MS,
    );
    if (timeout) {
      // Extra timeout padding to account for network calls
      return timeout + 5000;
    }
    return undefined;
  }
  return undefined;
};
const createActionExecutionResponse = (
  response: ActionApiResponse,
): ActionResponse => ({
  ...response.data,
  ...response.clientMeta,
});
const isErrorResponse = (response: ActionApiResponse) => {
  return !response.data.isExecutionSuccess;
};

/**
 * Api1
 * URL: https://example.com/{{Text1.text}}
 * Body: {
 *     "name": "{{this.params.name}}",
 *     "age": {{this.params.age}},
 *     "gender": {{Dropdown1.selectedOptionValue}}
 * }
 *
 * If you call
 * Api1.run(undefined, undefined, { name: "Hetu", age: Input1.text });
 *
 * executionParams is { name: "Hetu", age: Input1.text }
 * bindings is [
 *   "Text1.text",
 *   "Dropdown1.selectedOptionValue",
 *   "this.params.name",
 *   "this.params.age",
 * ]
 *
 * Return will be [
 *   { key: "Text1.text", value: "updateUser" },
 *   { key: "Dropdown1.selectedOptionValue", value: "M" },
 *   { key: "this.params.name", value: "Hetu" },
 *   { key: "this.params.age", value: 26 },
 * ]
 * @param bindings
 * @param executionParams
 */
export function* evaluateActionParams(
  bindings: string[] | undefined,
  executionParams?: Record<string, any> | string,
) {
  if (_.isNil(bindings) || bindings.length === 0) return [];

  // Evaluated all bindings of the actions. Pass executionParams if any
  const values: any = yield call(
    evaluateActionBindings,
    bindings,
    executionParams,
  );

  // Convert to object and transform non string values
  const actionParams: Record<string, string> = {};
  bindings.forEach((key, i) => {
    let value = values[i];
    if (typeof value === "object") value = JSON.stringify(value);
    actionParams[key] = value;
  });
  return mapToPropList(actionParams);
}

export function extractBindingsFromAction(action: Action) {
  const bindings: string[] = [];
  action.dynamicBindingPathList.forEach((a) => {
    const value = _.get(action, a.key);
    if (isDynamicValue(value)) {
      const { jsSnippets } = getDynamicBindings(value);
      bindings.push(...jsSnippets.filter((jsSnippet) => !!jsSnippet));
    }
  });
  return bindings;
}

export function* executeActionSaga(
  apiAction: RunActionPayload,
  event: ExecuteActionPayloadEvent,
) {
  const { actionId, onSuccess, onError, params } = apiAction;
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  const appMode = yield select(getAppMode);
  try {
    const api: Action = yield select(getAction, actionId);
    const currentApp: ApplicationPayload = yield select(getCurrentApplication);
    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: api.pluginType,
      name: api.name,
      pageId: api.pageId,
      appId: currentApp.id,
      appMode: appMode,
      appName: currentApp.name,
      isExampleApp: currentApp.appIsExample,
    });
    if (api.confirmBeforeExecute) {
      const confirmed = yield call(confirmRunActionSaga);
      if (!confirmed) {
        if (event.callback) {
          event.callback({ success: false });
        }
        return;
      }
    }

    yield put(executeApiActionRequest({ id: apiAction.actionId }));
    const actionParams: Property[] = yield call(
      evaluateActionParams,
      api.jsonPathKeys,
      params,
    );
    const pagination =
      event.type === EventType.ON_NEXT_PAGE
        ? "NEXT"
        : event.type === EventType.ON_PREV_PAGE
        ? "PREV"
        : undefined;

    const executeActionRequest: ExecuteActionRequest = {
      actionId: actionId,
      params: actionParams,
      paginationField: pagination,
      viewMode: appMode === APP_MODE.PUBLISHED,
    };
    const timeout = yield select(getActionTimeout, actionId);
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      executeActionRequest,
      timeout,
    );
    const payload = createActionExecutionResponse(response);
    yield put(
      executeApiActionSuccess({
        id: actionId,
        response: payload,
      }),
    );
    if (isErrorResponse(response)) {
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        { failed: true },
        actionId,
      );
      if (onError) {
        yield put(
          executeAction({
            dynamicString: onError,
            event: {
              ...event,
              type: EventType.ON_ERROR,
            },
            responseData: [payload.body, params],
          }),
        );
      } else {
        if (event.callback) {
          event.callback({ success: false });
        }
      }
      Toaster.show({
        text: createMessage(ERROR_API_EXECUTE, api.name),
        variant: Variant.danger,
      });
    } else {
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        undefined,
        actionId,
      );
      if (onSuccess) {
        yield put(
          executeAction({
            dynamicString: onSuccess,
            event: {
              ...event,
              type: EventType.ON_SUCCESS,
            },
            responseData: [payload.body, params],
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
    const api: Action = yield select(getAction, actionId);
    yield put(
      executeActionError({
        actionId: actionId,
        error,
        data: {
          ...EMPTY_RESPONSE,
          body: "There was an error executing this action",
        },
      }),
    );
    Toaster.show({
      text: createMessage(ERROR_API_EXECUTE, api.name),
      variant: Variant.danger,
    });
    if (onError) {
      yield put(
        executeAction({
          dynamicString: `{{${onError}}}`,
          event: {
            ...event,
            type: EventType.ON_ERROR,
          },
          responseData: [],
        }),
      );
    } else {
      if (event.callback) {
        event.callback({ success: false });
      }
    }
  }
}

function* executeActionTriggers(
  trigger: ActionDescription<any>,
  event: ExecuteActionPayloadEvent,
) {
  try {
    switch (trigger.type) {
      case "RUN_ACTION":
        yield call(executeActionSaga, trigger.payload, event);
        break;
      case "NAVIGATE_TO":
        yield call(navigateActionSaga, trigger.payload, event);
        break;
      case "SHOW_ALERT":
        yield call(showAlertSaga, trigger.payload, event);
        break;
      case "SHOW_MODAL_BY_NAME":
        yield put(trigger);
        if (event.callback) event.callback({ success: true });
        break;
      case "CLOSE_MODAL":
        yield put(trigger);
        if (event.callback) event.callback({ success: true });
        break;
      case "STORE_VALUE":
        yield call(storeValueLocally, trigger.payload, event);
        break;
      case "DOWNLOAD":
        yield call(downloadSaga, trigger.payload, event);
        break;
      case "COPY_TO_CLIPBOARD":
        yield call(copySaga, trigger.payload, event);
        break;
      case "RESET_WIDGET_META_RECURSIVE_BY_NAME":
        yield call(resetWidgetMetaByNameRecursiveSaga, trigger.payload, event);
        break;
      default:
        log.error("Trigger type unknown", trigger.type);
    }
  } catch (e) {
    if (event.callback) event.callback({ success: false });
  }
}

function* executeAppAction(action: ReduxAction<ExecuteActionPayload>) {
  const { dynamicString, event, responseData } = action.payload;
  log.debug({ dynamicString, responseData });

  if (dynamicString === undefined) {
    if (event.callback) event.callback({ success: false });
    log.error("Executing undefined action", event);
    return;
  }

  const triggers = yield call(
    evaluateDynamicTrigger,
    dynamicString,
    responseData,
  );

  log.debug({ triggers });
  if (triggers && triggers.length) {
    yield all(
      triggers.map((trigger: ActionDescription<any>) =>
        call(executeActionTriggers, trigger, event),
      ),
    );
  } else {
    if (event.callback) event.callback({ success: true });
  }
}

function* runActionInitSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField: PaginationField;
  }>,
) {
  const action = yield select(getAction, reduxAction.payload.id);

  if (action.confirmBeforeExecute) {
    const confirmed = yield call(confirmRunActionSaga);
    if (!confirmed) return;
  }

  yield put({
    type: ReduxActionTypes.RUN_ACTION_REQUEST,
    payload: reduxAction.payload,
  });
}

function* runActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField: PaginationField;
  }>,
) {
  try {
    const actionId = reduxAction.payload.id;
    const isSaving = yield select(isActionSaving(actionId));
    const isDirty = yield select(isActionDirty(actionId));
    if (isSaving || isDirty) {
      if (isDirty && !isSaving) {
        yield put(updateAction({ id: actionId }));
      }
      yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
    }
    const actionObject = yield select(getAction, actionId);
    const jsonPathKeys = actionObject.jsonPathKeys;

    const { paginationField } = reduxAction.payload;

    const params = yield call(evaluateActionParams, jsonPathKeys);
    const timeout = yield select(getActionTimeout, actionId);
    const appMode = yield select(getAppMode);
    const viewMode = appMode === APP_MODE.PUBLISHED;
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      {
        actionId,
        params,
        paginationField,
        viewMode,
      },
      timeout,
    );
    const isValidResponse = yield validateResponse(response);

    if (isValidResponse) {
      const payload = createActionExecutionResponse(response);

      const pageName = yield select(getCurrentPageNameByActionId, actionId);
      const eventName =
        actionObject.pluginType === PLUGIN_TYPE_API ? "RUN_API" : "RUN_QUERY";

      AnalyticsUtil.logEvent(eventName, {
        actionId,
        actionName: actionObject.name,
        pageName: pageName,
        responseTime: response.clientMeta.duration,
        apiType: "INTERNAL",
      });

      yield put({
        type: ReduxActionTypes.RUN_ACTION_SUCCESS,
        payload: { [actionId]: payload },
      });
      if (payload.isExecutionSuccess) {
        Toaster.show({
          text: createMessage(ACTION_RUN_SUCCESS),
          variant: Variant.success,
        });
      } else {
        Toaster.show({
          text: createMessage(ERROR_ACTION_EXECUTE_FAIL, actionObject.name),
          variant: Variant.warning,
        });
      }
    } else {
      let error = "An unexpected error occurred";
      if (response.data.body) {
        error = response.data.body.toString();
      }
      yield put({
        type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
        payload: { error, id: reduxAction.payload.id },
      });
    }
  } catch (error) {
    console.error(error);
    yield put({
      type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
      payload: { error, id: reduxAction.payload.id },
    });
  }
}

function* confirmRunActionSaga() {
  yield put(showRunActionConfirmModal(true));

  const { accept } = yield race({
    cancel: take(ReduxActionTypes.CANCEL_RUN_ACTION_CONFIRM_MODAL),
    accept: take(ReduxActionTypes.ACCEPT_RUN_ACTION_CONFIRM_MODAL),
  });

  return !!accept;
}

function* executePageLoadAction(pageAction: PageAction) {
  try {
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.EXECUTE_ACTION,
      {
        actionId: pageAction.id,
      },
      pageAction.id,
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
    );
    const pageId = yield select(getCurrentPageId);
    let currentApp: ApplicationPayload = yield select(getCurrentApplication);
    currentApp = currentApp || {};
    yield put(executeApiActionRequest({ id: pageAction.id }));
    const params: Property[] = yield call(
      evaluateActionParams,
      pageAction.jsonPathKeys,
    );
    const appMode = yield select(getAppMode);
    const viewMode = appMode === APP_MODE.PUBLISHED;
    const executeActionRequest: ExecuteActionRequest = {
      actionId: pageAction.id,
      params,
      viewMode,
    };
    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: pageAction.pluginType,
      name: pageAction.name,
      pageId: pageId,
      appMode: appMode,
      appId: currentApp.id,
      onPageLoad: true,
      appName: currentApp.name,
      isExampleApp: currentApp.appIsExample,
    });
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      executeActionRequest,
      pageAction.timeoutInMillisecond,
    );
    if (isErrorResponse(response)) {
      let body = _.get(response, "data.body");
      let message = `The action "${pageAction.name}" has failed.`;
      if (body) {
        if (_.isObject(body)) {
          body = JSON.stringify(body);
        }
        message += `\nERROR: "${body}"`;
      }

      yield put(
        executeActionError({
          actionId: pageAction.id,
          isPageLoad: true,
          error: _.get(response, "responseMeta.error", {
            message,
          }),
          data: createActionExecutionResponse(response),
        }),
      );
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        {
          failed: true,
        },
        pageAction.id,
      );
    } else {
      const payload = createActionExecutionResponse(response);
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        undefined,
        pageAction.id,
      );
      yield put(
        executeApiActionSuccess({
          id: pageAction.id,
          response: payload,
          isPageLoad: true,
        }),
      );
      yield take(ReduxActionTypes.SET_EVALUATED_TREE);
    }
  } catch (e) {
    yield put(
      executeActionError({
        actionId: pageAction.id,
        isPageLoad: true,
        error: {
          message: `The action "${pageAction.name}" has failed.`,
        },
        data: {
          ...EMPTY_RESPONSE,
          body: "There was an error executing this action",
        },
      }),
    );
  }
}

function* executePageLoadActionsSaga(action: ReduxAction<PageAction[][]>) {
  try {
    const pageActions = action.payload;
    const actionCount = _.flatten(pageActions).length;
    PerformanceTracker.startAsyncTracking(
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
      { numActions: actionCount },
    );
    for (const actionSet of pageActions) {
      // Load all sets in parallel
      yield* yield all(
        actionSet.map((apiAction) => call(executePageLoadAction, apiAction)),
      );
    }
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
    );
  } catch (e) {
    log.error(e);

    Toaster.show({
      text: createMessage(ERROR_FAIL_ON_PAGE_LOAD_ACTIONS),
      variant: Variant.danger,
    });
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeAppAction),
    takeLatest(ReduxActionTypes.RUN_ACTION_REQUEST, runActionSaga),
    takeLatest(ReduxActionTypes.RUN_ACTION_INIT, runActionInitSaga),
    takeLatest(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
      executePageLoadActionsSaga,
    ),
  ]);
}
