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
import { AppToaster } from "components/editorComponents/ToastComponent";
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
  getApplicationViewerPageURL,
} from "constants/routes";
import {
  executeApiActionRequest,
  executeApiActionSuccess,
  showRunActionConfirmModal,
  updateAction,
} from "actions/actionActions";
import { Action, RestAction } from "entities/Action";
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
import { ToastType } from "react-toastify";
import { PLUGIN_TYPE_API } from "constants/ApiEditorConstants";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "constants/ApiConstants";
import { updateAppStore } from "actions/pageActions";
import { getAppStoreName } from "constants/AppConstants";
import downloadjs from "downloadjs";
import { getType, Types } from "utils/TypeHelpers";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import { APP_MODE } from "reducers/entityReducers/appReducer";
import {
  getAppMode,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import { evaluateDynamicTrigger, evaluateSingleValue } from "./evaluationsSaga";

function* navigateActionSaga(
  action: { pageNameOrUrl: string; params: Record<string, string> },
  event: ExecuteActionPayloadEvent,
) {
  const pageList = yield select(getPageList);
  const applicationId = yield select(getCurrentApplicationId);
  const page = _.find(
    pageList,
    (page: Page) => page.pageName === action.pageNameOrUrl,
  );
  if (page) {
    AnalyticsUtil.logEvent("NAVIGATE", {
      pageName: action.pageNameOrUrl,
      pageParams: action.params,
    });
    // TODO need to make this check via RENDER_MODE;
    const path =
      history.location.pathname.indexOf("/edit") !== -1
        ? BUILDER_PAGE_URL(applicationId, page.pageId, action.params)
        : getApplicationViewerPageURL(
            applicationId,
            page.pageId,
            action.params,
          );
    history.push(path);
    if (event.callback) event.callback({ success: true });
  } else {
    AnalyticsUtil.logEvent("NAVIGATE", {
      navUrl: action.pageNameOrUrl,
    });
    // Add a default protocol if it doesn't exist.
    let url = action.pageNameOrUrl;
    if (url.indexOf("://") === -1) {
      url = "https://" + url;
    }
    window.location.assign(url);
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
      AppToaster.show({
        message: "Download failed. File name was not provided",
        type: "error",
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
    AppToaster.show({
      message: `Download failed. ${err}`,
      type: "error",
    });
    if (event.callback) event.callback({ success: false });
  }
}

export const getActionTimeout = (
  state: AppState,
  actionId: string,
): number | undefined => {
  const action = _.find(state.entities.actions, a => a.config.id === actionId);
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

export function* evaluateDynamicBoundValueSaga(path: string): any {
  return yield call(evaluateSingleValue, `{{${path}}}`);
}

const EXECUTION_PARAM_PATH = "this.params";
const getExecutionParamPath = (key: string) => `${EXECUTION_PARAM_PATH}.${key}`;

export function* getActionParams(
  bindings: string[] | undefined,
  executionParams?: Record<string, any>,
) {
  if (_.isNil(bindings)) return [];
  let dataTreeBindings = bindings;

  if (executionParams && Object.keys(executionParams).length) {
    // List of params in the path format
    const executionParamsPathList = Object.keys(executionParams).map(
      getExecutionParamPath,
    );
    const paramSearchRegex = new RegExp(executionParamsPathList.join("|"), "g");
    // Bindings with references to execution params
    const executionBindings = bindings.filter(binding =>
      paramSearchRegex.test(binding),
    );

    // Replace references with values
    const replacedBindings = executionBindings.map(binding => {
      let replaced = binding;
      const matches = binding.match(paramSearchRegex);
      if (matches && matches.length) {
        matches.forEach(match => {
          // we add one for substring index to account for '.'
          const paramKey = match.substring(EXECUTION_PARAM_PATH.length + 1);
          let paramValue = executionParams[paramKey];
          if (paramValue) {
            if (typeof paramValue === "object") {
              paramValue = JSON.stringify(paramValue);
            }
            replaced = replaced.replace(match, paramValue);
          }
        });
      }
      return replaced;
    });
    // Replace binding with replaced bindings for evaluation
    dataTreeBindings = dataTreeBindings.map(key => {
      if (executionBindings.includes(key)) {
        return replacedBindings[executionBindings.indexOf(key)];
      }
      return key;
    });
  }
  // Evaluate all values
  const values: any = yield all(
    dataTreeBindings.map((binding: string) => {
      return call(evaluateDynamicBoundValueSaga, binding);
    }),
  );
  // convert to object and transform non string values
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
  action.dynamicBindingPathList.forEach(a => {
    const value = _.get(action, a.key);
    if (isDynamicValue(value)) {
      const { jsSnippets } = getDynamicBindings(value);
      bindings.push(...jsSnippets.filter(jsSnippet => !!jsSnippet));
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
  try {
    const api: RestAction = yield select(getAction, actionId);
    const currentApp: ApplicationPayload = yield select(getCurrentApplication);
    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: api.pluginType,
      name: api.name,
      pageId: api.pageId,
      appId: currentApp.id,
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
      getActionParams,
      api.jsonPathKeys,
      params,
    );
    const pagination =
      event.type === EventType.ON_NEXT_PAGE
        ? "NEXT"
        : event.type === EventType.ON_PREV_PAGE
        ? "PREV"
        : undefined;
    const appMode = yield select(getAppMode);

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
            responseData: payload,
          }),
        );
      } else {
        if (event.callback) {
          event.callback({ success: false });
        }
      }
      AppToaster.show({
        message:
          api.name + " failed to execute. Please check it's configuration",
        type: "error",
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
    AppToaster.show({
      message: "Action execution failed",
      type: "error",
    });
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
        AppToaster.show({
          message: trigger.payload.message,
          type: trigger.payload.style,
        });
        if (event.callback) event.callback({ success: true });
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
      default:
        yield put(
          executeActionError({
            error: "Trigger type unknown",
            actionId: "",
          }),
        );
    }
  } catch (e) {
    yield put(
      executeActionError({
        error: "Failed to execute action",
        actionId: "",
      }),
    );
    if (event.callback) event.callback({ success: false });
  }
}

function* executeAppAction(action: ReduxAction<ExecuteActionPayload>) {
  const { dynamicString, event, responseData } = action.payload;
  log.debug({ dynamicString, responseData });

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

    const params = yield call(getActionParams, jsonPathKeys);
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
        AppToaster.show({
          message: "Action ran successfully",
          type: ToastType.SUCCESS,
        });
      } else {
        AppToaster.show({
          message: "Action returned an error response",
          type: ToastType.WARNING,
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
    getActionParams,
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
    yield put(
      executeActionError({
        actionId: pageAction.id,
        error: response.responseMeta.error,
        isPageLoad: true,
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
        actionSet.map(apiAction => call(executePageLoadAction, apiAction)),
      );
    }
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.EXECUTE_PAGE_LOAD_ACTIONS,
    );
  } catch (e) {
    log.error(e);
    AppToaster.show({
      message: "Failed to load onPageLoad actions",
      type: ToastType.ERROR,
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
