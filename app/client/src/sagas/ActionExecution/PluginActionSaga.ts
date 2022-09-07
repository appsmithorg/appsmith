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
} from "@appsmith/constants/ReduxActionConstants";
import ActionAPI, {
  ActionExecutionResponse,
  ActionResponse,
  ExecuteActionRequest,
  PaginationField,
} from "api/ActionAPI";
import {
  getAction,
  getCurrentPageNameByActionId,
  getPlugin,
  isActionDirty,
  isActionSaving,
  getJSCollection,
} from "selectors/entitiesSelector";
import {
  getAppMode,
  getCurrentApplication,
} from "selectors/applicationSelectors";
import _, { get, isArray, isString, set } from "lodash";
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
import { isBlobUrl, parseBlobUrl } from "utils/AppsmithUtils";
import { getType, Types } from "utils/TypeHelpers";
import { matchPath } from "react-router";
import {
  API_EDITOR_BASE_PATH,
  API_EDITOR_ID_PATH,
  API_EDITOR_PATH_WITH_SELECTED_PAGE_ID,
  INTEGRATION_EDITOR_PATH,
  QUERIES_EDITOR_BASE_PATH,
  QUERIES_EDITOR_ID_PATH,
  CURL_IMPORT_PAGE_PATH,
} from "constants/routes";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
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
import { shouldBeDefined, trimQueryString } from "utils/helpers";
import { JSCollection } from "entities/JSCollection";
import {
  executeAppAction,
  TriggerMeta,
} from "sagas/ActionExecution/ActionExecutionSagas";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { getFormNames, getFormValues } from "redux-form";
import { CURL_IMPORT_FORM } from "constants/forms";
import { submitCurlImportForm } from "actions/importActions";
import { curlImportFormValues } from "pages/Editor/APIEditor/helpers";
import { matchBasePath } from "pages/Editor/Explorer/helpers";
import { isTrueObject } from "workers/evaluationUtils";
import { handleExecuteJSFunctionSaga } from "sagas/JSPaneSagas";
import { Plugin } from "api/PluginApi";
import { setDefaultActionDisplayFormat } from "./PluginActionSagaUtils";

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
 * This function resolves :
 * - individual objects containing blob urls
 * - blob urls directly
 * - else returns the value unchanged
 *
 * @param value
 */

function* resolvingBlobUrls(value: any) {
  if (isTrueObject(value)) {
    const blobUrlPaths: string[] = [];
    Object.keys(value).forEach((propertyName) => {
      if (isBlobUrl(value[propertyName])) {
        blobUrlPaths.push(propertyName);
      }
    });

    for (const blobUrlPath of blobUrlPaths) {
      const blobUrl = value[blobUrlPath] as string;
      const resolvedBlobValue: unknown = yield call(readBlob, blobUrl);
      set(value, blobUrlPath, resolvedBlobValue);
    }
  } else if (isBlobUrl(value)) {
    // @ts-expect-error: Values can take many types
    value = yield call(readBlob, value);
  }

  return value;
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
  formData: FormData,
  executionParams?: Record<string, any> | string,
) {
  if (_.isNil(bindings) || bindings.length === 0) return [];

  // Evaluated all bindings of the actions. Pass executionParams if any
  // @ts-expect-error: Values can take many types
  const values = yield call(evaluateActionBindings, bindings, executionParams);

  // Add keys values to formData for the multipart submission
  for (let i = 0; i < bindings.length; i++) {
    const key = bindings[i];
    let value = values[i];

    if (isArray(value)) {
      const tempArr = [];
      // array of objects containing blob urls that is loops and individual object is checked for resolution of blob urls.
      for (const val of value) {
        const newVal: unknown = yield call(resolvingBlobUrls, val);
        tempArr.push(newVal);
      }
      value = tempArr;
    } else {
      // @ts-expect-error: Values can take many types
      value = yield call(resolvingBlobUrls, value);
    }

    if (typeof value === "object") {
      value = JSON.stringify(value);
    }

    value = new Blob([value], { type: "text/plain" });

    formData.append(encodeURIComponent(key), value);
  }
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
  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const action = shouldBeDefined<Action>(
    yield select(getAction, actionId),
    `Action not found for id - ${actionId}`,
  );
  const currentApp: ApplicationPayload = yield select(getCurrentApplication);
  AnalyticsUtil.logEvent("EXECUTE_ACTION", {
    type: action?.pluginType,
    name: action?.name,
    pageId: action?.pageId,
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
        callbackData: [payload.body, params],
        ...triggerMeta,
      });
      throw new PluginTriggerFailureError(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, action.name),
        [payload.body, params],
      );
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
        callbackData: [payload.body, params],
        ...triggerMeta,
      });
    }
  }
  return [payload.body, params];
}

function* runActionShortcutSaga() {
  const pathname = window.location.pathname;
  const baseMatch = matchBasePath(pathname);
  if (!baseMatch) return;
  const { path } = baseMatch;
  const match: any = matchPath(pathname, {
    path: [
      trimQueryString(`${path}${API_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${API_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${API_EDITOR_PATH_WITH_SELECTED_PAGE_ID}`),
      trimQueryString(`${path}${INTEGRATION_EDITOR_PATH}`),
      trimQueryString(`${path}${SAAS_EDITOR_API_ID_PATH}`),
      `${path}${CURL_IMPORT_PAGE_PATH}`,
    ],
    exact: true,
    strict: false,
  });

  // get the current form name
  const currentFormNames: string[] = yield select(getFormNames());

  if (!match || !match.params) return;
  const { apiId, pageId, queryId } = match.params;
  const actionId = apiId || queryId;
  if (actionId) {
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
  } else if (
    !!currentFormNames &&
    currentFormNames.includes(CURL_IMPORT_FORM) &&
    !actionId
  ) {
    // if the current form names include the curl form and there are no actionIds i.e. its not an api or query
    // get the form values and call the submit curl import form function with its data
    const formValues: curlImportFormValues = yield select(
      getFormValues(CURL_IMPORT_FORM),
    );

    // if the user has not edited the curl input field, assign an empty string to it, so it doesnt throw an error.
    if (!formValues?.curl) formValues["curl"] = "";

    yield put(submitCurlImportForm(formValues));
  } else {
    return;
  }
}

function* runActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField: PaginationField;
  }>,
) {
  const actionId = reduxAction.payload.id;
  const isSaving: boolean = yield select(isActionSaving(actionId));
  const isDirty: boolean = yield select(isActionDirty(actionId));
  const isSavingEntity: boolean = yield select(getIsSavingEntity);
  if (isSaving || isDirty || isSavingEntity) {
    if (isDirty && !isSaving) {
      yield put(updateAction({ id: actionId }));
    }
    yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
  }
  const actionObject = shouldBeDefined<Action>(
    yield select(getAction, actionId),
    `action not found for id - ${actionId}`,
  );

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
    error = (e as Error).message;
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
      payload: {
        error: appsmithConsoleErrorMessageList[0],
        id: reduxAction.payload.id,
      },
    });
    return;
  }

  const pageName: string = yield select(getCurrentPageNameByActionId, actionId);
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

function* executeOnPageLoadJSAction(pageAction: PageAction) {
  const collectionId = pageAction.collectionId;
  if (collectionId) {
    const collection: JSCollection = yield select(
      getJSCollection,
      collectionId,
    );
    const jsAction = collection.actions.find((d) => d.id === pageAction.id);
    if (!!jsAction) {
      if (jsAction.confirmBeforeExecute) {
        const modalPayload = {
          name: pageAction.name,
          modalOpen: true,
          modalType: ModalType.RUN_ACTION,
        };

        const confirmed: unknown = yield call(
          requestModalConfirmationSaga,
          modalPayload,
        );
        if (!confirmed) {
          yield put({
            type: ReduxActionTypes.RUN_ACTION_CANCELLED,
            payload: { id: pageAction.id },
          });
          throw new UserCancelledActionExecutionError();
        }
      }
      const data = {
        collectionName: collection.name,
        action: jsAction,
        collectionId: collectionId,
      };
      yield call(handleExecuteJSFunctionSaga, data);
    }
  }
}

function* executePageLoadAction(pageAction: PageAction) {
  if (pageAction.hasOwnProperty("collectionId")) {
    yield call(executeOnPageLoadJSAction, pageAction);
  } else {
    const pageId: string | undefined = yield select(getCurrentPageId);
    let currentApp: ApplicationPayload = yield select(getCurrentApplication);
    currentApp = currentApp || {};
    const appMode: APP_MODE | undefined = yield select(getAppMode);
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
      // @ts-expect-error: no idea how to type this
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
    // @ts-expect-error: plugin Action can take many types
    pluginAction = yield select(getAction, actionOrActionId);
    actionId = actionOrActionId;
  } else {
    pluginAction = shouldBeDefined<Action>(
      yield select(getAction, actionOrActionId.id),
      `Action not found for id -> ${actionOrActionId.id}`,
    );
    actionId = actionOrActionId.id;
  }

  if (pluginAction.confirmBeforeExecute) {
    const modalPayload = {
      name: pluginAction.name,
      modalOpen: true,
      modalType: ModalType.RUN_ACTION,
    };

    const confirmed: unknown = yield call(
      requestModalConfirmationSaga,
      modalPayload,
    );

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

  const appMode: APP_MODE | undefined = yield select(getAppMode);
  const timeout: number | undefined = yield select(getActionTimeout, actionId);

  const executeActionRequest: ExecuteActionRequest = {
    actionId: actionId,
    viewMode: appMode === APP_MODE.PUBLISHED,
  };

  if (paginationField) {
    executeActionRequest.paginationField = paginationField;
  }

  const formData = new FormData();
  formData.append("executeActionDTO", JSON.stringify(executeActionRequest));
  yield call(evaluateActionParams, pluginAction.jsonPathKeys, formData, params);

  const response: ActionExecutionResponse = yield ActionAPI.executeAction(
    formData,
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
    let plugin: Plugin | undefined;
    if (!!pluginAction.pluginId) {
      plugin = shouldBeDefined<Plugin>(
        yield select(getPlugin, pluginAction.pluginId),
        `Plugin not found for id - ${pluginAction.pluginId}`,
      );
    }

    // sets the default display format for action response e.g Raw, Json or Table
    yield setDefaultActionDisplayFormat(actionId, plugin, payload);

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
