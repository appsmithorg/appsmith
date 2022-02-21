import { all, call, put, select, take, takeLatest } from "redux-saga/effects";
import {
  executePluginActionError,
  executePluginActionRequest,
  executePluginActionSuccess,
  runAction,
  updateAction,
} from "actions/pluginActionActions";
import {
  ApplicationPayload,
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import ActionAPI, {
  ActionExecutionResponse,
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
import {
  getAppMode,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import _, { get, isString } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE, PLATFORM_ERROR } from "entities/AppsmithConsole";
import { validateResponse } from "sagas/ErrorSagas";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";
import { Action, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  ERROR_ACTION_EXECUTE_FAIL,
  ERROR_FAIL_ON_PAGE_LOAD_ACTIONS,
  ERROR_PLUGIN_ACTION_EXECUTE,
} from "@appsmith/constants/messages";
import { Variant } from "components/ads/common";
import {
  EventType,
  PageAction,
  RESP_HEADER_DATATYPE,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  getCurrentPageId,
  getIsSavingEntity,
  getLayoutOnLoadActions,
} from "selectors/editorSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as log from "loglevel";
import { EMPTY_RESPONSE } from "components/editorComponents/ApiResponseView";
import { AppState } from "reducers";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "@appsmith/constants/ApiConstants";
import { evaluateActionBindings } from "sagas/EvaluationsSaga";
import { isBlobUrl, mapToPropList, parseBlobUrl } from "utils/AppsmithUtils";
import { getType, Types } from "utils/TypeHelpers";
import { matchPath } from "react-router";
import {
  API_EDITOR_ID_URL,
  API_EDITOR_URL,
  API_EDITOR_URL_WITH_SELECTED_PAGE_ID,
  INTEGRATION_EDITOR_URL,
  QUERIES_EDITOR_ID_URL,
  QUERIES_EDITOR_URL,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_URL } from "pages/Editor/SaaSEditor/constants";
import {
  ActionTriggerType,
  RunPluginActionDescription,
} from "entities/DataTree/actionTriggers";
import { APP_MODE } from "entities/App";
import { FileDataTypes } from "widgets/constants";
import { hideDebuggerErrors } from "actions/debuggerActions";
import {
  ActionValidationError,
  getErrorAsString,
  PluginActionExecutionError,
  PluginTriggerFailureError,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";
import { trimQueryString } from "utils/helpers";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";

enum ActionResponseDataTypes {
  BINARY = "BINARY",
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
  response: ActionExecutionResponse,
): ActionResponse => {
  const payload = response.data;
  if (payload.statusCode === "200 OK" && payload.hasOwnProperty("headers")) {
    const respHeaders = payload.headers;
    if (
      respHeaders.hasOwnProperty(RESP_HEADER_DATATYPE) &&
      respHeaders[RESP_HEADER_DATATYPE].length > 0 &&
      respHeaders[RESP_HEADER_DATATYPE][0] === ActionResponseDataTypes.BINARY &&
      getType(payload.body) === Types.STRING
    ) {
      // Decoding from base64 to handle the binary files because direct
      // conversion of binary files to string causes corruption in the final output
      // this is to only handle the download of binary files
      payload.body = atob(payload.body as string);
    }
  }
  return {
    ...payload,
    ...response.clientMeta,
  };
};
const isErrorResponse = (response: ActionExecutionResponse) => {
  return !response.data.isExecutionSuccess;
};

/**
 *
 * @param blobUrl string A blob url with type added a query param
 * @returns promise that resolves to file content
 */
function* readBlob(blobUrl: string): any {
  const [url, fileType] = parseBlobUrl(blobUrl);
  const file = yield fetch(url).then((r) => r.blob());

  return yield new Promise((resolve) => {
    const reader = new FileReader();
    if (fileType === FileDataTypes.Base64) {
      reader.readAsDataURL(file);
    } else if (fileType === FileDataTypes.Binary) {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
    reader.onloadend = () => {
      resolve(reader.result);
    };
  });
}

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
function* evaluateActionParams(
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
  for (let i = 0; i < bindings.length; i++) {
    const key = bindings[i];
    let value = values[i];
    if (typeof value === "object") value = JSON.stringify(value);
    if (isBlobUrl(value)) {
      value = yield call(readBlob, value);
    }
    actionParams[key] = value;
  }
  return mapToPropList(actionParams);
}

export default function* executePluginActionTriggerSaga(
  pluginAction: RunPluginActionDescription["payload"],
  eventType: EventType,
  triggerMeta: TriggerMeta,
) {
  const { actionId, onError, onSuccess, params } = pluginAction;
  if (getType(params) !== Types.OBJECT) {
    throw new ActionValidationError(
      ActionTriggerType.RUN_PLUGIN_ACTION,
      "params",
      Types.OBJECT,
      getType(params),
    );
  }
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  const appMode = yield select(getAppMode);
  const action: Action = yield select(getAction, actionId);
  const currentApp: ApplicationPayload = yield select(getCurrentApplication);
  AnalyticsUtil.logEvent("EXECUTE_ACTION", {
    type: action.pluginType,
    name: action.name,
    pageId: action.pageId,
    appId: currentApp.id,
    appMode: appMode,
    appName: currentApp.name,
    isExampleApp: currentApp.appIsExample,
  });
  const pagination =
    eventType === EventType.ON_NEXT_PAGE
      ? "NEXT"
      : eventType === EventType.ON_PREV_PAGE
      ? "PREV"
      : undefined;
  AppsmithConsole.info({
    text: "Execution started from widget request",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: action.name,
      id: actionId,
    },
    state: action.actionConfiguration,
  });
  const executePluginActionResponse: ExecutePluginActionResponse = yield call(
    executePluginActionSaga,
    action.id,
    pagination,
    params,
  );
  const { isError, payload } = executePluginActionResponse;

  if (isError) {
    AppsmithConsole.addError({
      id: actionId,
      logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
      text: `Execution failed with status ${payload.statusCode}`,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: action.name,
        id: actionId,
      },
      state: payload.request,
      messages: [
        {
          // Need to stringify cause this gets rendered directly
          // and rendering objects can crash the app
          message: !isString(payload.body)
            ? JSON.stringify(payload.body)
            : payload.body,
          type: PLATFORM_ERROR.PLUGIN_EXECUTION,
          subType: payload.errorType,
        },
      ],
    });
    if (onError) {
      yield call(executeAppAction, {
        event: { type: eventType },
        dynamicString: onError,
        responseData: [payload.body, params],
        ...triggerMeta,
      });
    } else {
      throw new PluginTriggerFailureError(
        createMessage(ERROR_PLUGIN_ACTION_EXECUTE, action.name),
        [payload.body, params],
      );
    }
  } else {
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: "Executed successfully from widget request",
      timeTaken: payload.duration,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: action.name,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
    if (onSuccess) {
      yield call(executeAppAction, {
        event: { type: eventType },
        dynamicString: onSuccess,
        responseData: [payload.body, params],
        ...triggerMeta,
      });
    }
  }
  return [payload.body, params];
}

function* runActionShortcutSaga() {
  const location = window.location.pathname;
  const match: any = matchPath(location, {
    path: [
      trimQueryString(API_EDITOR_URL()),
      trimQueryString(API_EDITOR_ID_URL()),
      trimQueryString(QUERIES_EDITOR_URL()),
      trimQueryString(QUERIES_EDITOR_ID_URL()),
      trimQueryString(API_EDITOR_URL_WITH_SELECTED_PAGE_ID()),
      trimQueryString(INTEGRATION_EDITOR_URL()),
      trimQueryString(SAAS_EDITOR_API_ID_URL()),
    ],
    exact: true,
    strict: false,
  });
  if (!match || !match.params) return;
  const { apiId, pageId, queryId } = match.params;
  const actionId = apiId || queryId;
  if (!actionId) return;
  const trackerId = apiId
    ? PerformanceTransactionName.RUN_API_SHORTCUT
    : PerformanceTransactionName.RUN_QUERY_SHORTCUT;
  PerformanceTracker.startTracking(trackerId, {
    actionId,
    pageId,
  });
  AnalyticsUtil.logEvent(trackerId as EventName, {
    actionId,
  });
  yield put(runAction(actionId));
}

function* runActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField: PaginationField;
  }>,
) {
  const actionId = reduxAction.payload.id;
  const isSaving = yield select(isActionSaving(actionId));
  const isDirty = yield select(isActionDirty(actionId));
  const isSavingEntity = yield select(getIsSavingEntity);
  if (isSaving || isDirty || isSavingEntity) {
    if (isDirty && !isSaving) {
      yield put(updateAction({ id: actionId }));
    }
    yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
  }
  const actionObject = yield select(getAction, actionId);
  const datasourceUrl = get(
    actionObject,
    "datasource.datasourceConfiguration.url",
  );
  AppsmithConsole.info({
    text: "Execution started from user request",
    source: {
      type: ENTITY_TYPE.ACTION,
      name: actionObject.name,
      id: actionId,
    },
    state: {
      ...actionObject.actionConfiguration,
      ...(datasourceUrl && {
        url: datasourceUrl,
      }),
    },
  });

  const { id, paginationField } = reduxAction.payload;

  let payload = EMPTY_RESPONSE;
  let isError = true;
  let error = "";
  try {
    const executePluginActionResponse: ExecutePluginActionResponse = yield call(
      executePluginActionSaga,
      id,
      paginationField,
    );
    payload = executePluginActionResponse.payload;
    isError = executePluginActionResponse.isError;
  } catch (e) {
    // When running from the pane, we just want to end the saga if the user has
    // cancelled the call. No need to log any errors
    if (e instanceof UserCancelledActionExecutionError) {
      return;
    }
    log.error(e);
    error = e.message;
  }

  // Error should be readable error if present.
  // Otherwise, payload's body.
  // Default to "An unexpected error occurred" if none is available

  const readableError = payload.readableError
    ? getErrorAsString(payload.readableError)
    : undefined;

  const payloadBodyError = payload.body
    ? getErrorAsString(payload.body)
    : undefined;

  const defaultError = "An unexpected error occurred";

  if (isError) {
    error = readableError || payloadBodyError || defaultError;

    // In case of debugger, both the current error message
    // and the readableError needs to be present,
    // since the readableError may be malformed for certain errors.

    const appsmithConsoleErrorMessageList = [
      {
        message: error,
        type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        subType: payload.errorType,
      },
    ];

    if (error === readableError && !!payloadBodyError) {
      appsmithConsoleErrorMessageList.push({
        message: payloadBodyError,
        type: PLATFORM_ERROR.PLUGIN_EXECUTION,
        subType: payload.errorType,
      });
    }

    AppsmithConsole.addError({
      id: actionId,
      logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
      text: `Execution failed${
        payload.statusCode ? ` with status ${payload.statusCode}` : ""
      }`,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: actionObject.name,
        id: actionId,
      },
      messages: appsmithConsoleErrorMessageList,
      state: payload.request,
    });

    Toaster.show({
      text: createMessage(ERROR_ACTION_EXECUTE_FAIL, actionObject.name),
      variant: Variant.danger,
    });

    yield put({
      type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
      payload: { error, id: reduxAction.payload.id },
    });
    return;
  }

  const pageName = yield select(getCurrentPageNameByActionId, actionId);
  let eventName: EventName = "RUN_API";
  if (actionObject.pluginType === PluginType.DB) {
    eventName = "RUN_QUERY";
  }
  if (actionObject.pluginType === PluginType.SAAS) {
    eventName = "RUN_SAAS_API";
  }

  AnalyticsUtil.logEvent(eventName, {
    actionId,
    actionName: actionObject.name,
    pageName: pageName,
    responseTime: payload.duration,
    apiType: "INTERNAL",
  });

  yield put({
    type: ReduxActionTypes.RUN_ACTION_SUCCESS,
    payload: { [actionId]: payload },
  });
  if (payload.isExecutionSuccess) {
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: "Executed successfully from user request",
      timeTaken: payload.duration,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: actionObject.name,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
  }
}

function* executePageLoadAction(pageAction: PageAction) {
  const pageId = yield select(getCurrentPageId);
  let currentApp: ApplicationPayload = yield select(getCurrentApplication);
  currentApp = currentApp || {};
  const appMode = yield select(getAppMode);
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

  let payload = EMPTY_RESPONSE;
  let isError = true;
  const error = `The action "${pageAction.name}" has failed.`;
  try {
    const executePluginActionResponse: ExecutePluginActionResponse = yield call(
      executePluginActionSaga,
      pageAction,
    );
    payload = executePluginActionResponse.payload;
    isError = executePluginActionResponse.isError;
  } catch (e) {
    log.error(e);
  }

  if (isError) {
    AppsmithConsole.addError({
      id: pageAction.id,
      logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
      text: `Execution failed with status ${payload.statusCode}`,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: pageAction.name,
        id: pageAction.id,
      },
      state: payload.request,
      messages: [
        {
          message: error,
          type: PLATFORM_ERROR.PLUGIN_EXECUTION,
          subType: payload.errorType,
        },
      ],
    });

    yield put(
      executePluginActionError({
        actionId: pageAction.id,
        isPageLoad: true,
        error: { message: error },
        data: payload,
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
    PerformanceTracker.stopAsyncTracking(
      PerformanceTransactionName.EXECUTE_ACTION,
      undefined,
      pageAction.id,
    );
    yield put(
      executePluginActionSuccess({
        id: pageAction.id,
        response: payload,
        isPageLoad: true,
      }),
    );
    yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  }
}

function* executePageLoadActionsSaga() {
  try {
    const pageActions: PageAction[][] = yield select(getLayoutOnLoadActions);
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

    // We show errors in the debugger once onPageLoad actions
    // are executed
    yield put(hideDebuggerErrors(false));
  } catch (e) {
    log.error(e);

    Toaster.show({
      text: createMessage(ERROR_FAIL_ON_PAGE_LOAD_ACTIONS),
      variant: Variant.danger,
    });
  }
}

type ExecutePluginActionResponse = {
  payload: ActionResponse;
  isError: boolean;
};
/*
 * This saga handles the complete plugin action execution flow. It will respond with a
 * payload and isError property which indicates if the response is of an error type.
 * In case of the execution was not completed, it will throw errors of type
 * PluginActionExecutionError which needs to be handled by any saga that calls this.
 * */
function* executePluginActionSaga(
  actionOrActionId: PageAction | string,
  paginationField?: PaginationField,
  params?: Record<string, unknown>,
) {
  let pluginAction;
  let actionId;
  if (isString(actionOrActionId)) {
    pluginAction = yield select(getAction, actionOrActionId);
    actionId = actionOrActionId;
  } else {
    pluginAction = actionOrActionId;
    actionId = actionOrActionId.id;
  }

  if (pluginAction.confirmBeforeExecute) {
    const confirmed = yield call(requestModalConfirmationSaga);
    if (!confirmed) {
      yield put({
        type: ReduxActionTypes.RUN_ACTION_CANCELLED,
        payload: { id: actionId },
      });
      throw new UserCancelledActionExecutionError();
    }
  }
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  yield put(executePluginActionRequest({ id: actionId }));

  const actionParams: Property[] = yield call(
    evaluateActionParams,
    pluginAction.jsonPathKeys,
    params,
  );

  const appMode = yield select(getAppMode);
  const timeout = yield select(getActionTimeout, actionId);

  const executeActionRequest: ExecuteActionRequest = {
    actionId: actionId,
    params: actionParams,
    viewMode: appMode === APP_MODE.PUBLISHED,
  };

  if (paginationField) {
    executeActionRequest.paginationField = paginationField;
  }

  const response: ActionExecutionResponse = yield ActionAPI.executeAction(
    executeActionRequest,
    timeout,
  );
  PerformanceTracker.stopAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
  );
  try {
    yield validateResponse(response);
    const payload = createActionExecutionResponse(response);
    yield put(
      executePluginActionSuccess({
        id: actionId,
        response: payload,
      }),
    );
    return {
      payload,
      isError: isErrorResponse(response),
    };
  } catch (e) {
    yield put(
      executePluginActionSuccess({
        id: actionId,
        response: EMPTY_RESPONSE,
      }),
    );
    throw new PluginActionExecutionError("Response not valid", false, response);
  }
}

export function* watchPluginActionExecutionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.RUN_ACTION_REQUEST, runActionSaga),
    takeLatest(
      ReduxActionTypes.RUN_ACTION_SHORTCUT_REQUEST,
      runActionShortcutSaga,
    ),
    takeLatest(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
      executePageLoadActionsSaga,
    ),
  ]);
}
