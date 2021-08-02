import {
  all,
  call,
  put,
  race,
  select,
  take,
  takeLatest,
} from "redux-saga/effects";
import {
  executeApiActionRequest,
  executeApiActionSuccess,
  executePageLoadActionsComplete,
  showRunActionConfirmModal,
  updateAction,
} from "actions/actionActions";
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
import { APP_MODE } from "reducers/entityReducers/appReducer";
import _, { get, isString } from "lodash";
import AppsmithConsole from "utils/AppsmithConsole";
import { ENTITY_TYPE } from "entities/AppsmithConsole";
import { validateResponse } from "sagas/ErrorSagas";
import AnalyticsUtil, { EventName } from "utils/AnalyticsUtil";
import { Action, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { Toaster } from "components/ads/Toast";
import {
  createMessage,
  ERROR_ACTION_EXECUTE_FAIL,
  ERROR_API_EXECUTE,
  ERROR_FAIL_ON_PAGE_LOAD_ACTIONS,
} from "constants/messages";
import { Variant } from "components/ads/common";
import {
  EventType,
  ExecuteActionPayloadEvent,
  PageAction,
  RESP_HEADER_DATATYPE,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  getCurrentPageId,
  getLayoutOnLoadActions,
} from "selectors/editorSelectors";
import PerformanceTracker, {
  PerformanceTransactionName,
} from "utils/PerformanceTracker";
import * as log from "loglevel";
import { executeActionError } from "actions/widgetActions";
import { EMPTY_RESPONSE } from "components/editorComponents/ApiResponseView";
import { AppState } from "reducers";
import { DEFAULT_EXECUTE_ACTION_TIMEOUT_MS } from "constants/ApiConstants";
import { evaluateActionBindings } from "sagas/EvaluationsSaga";
import { mapToPropList } from "utils/AppsmithUtils";
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
import { PluginActionDescription } from "entities/DataTree/actionTriggers";

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
  bindings.forEach((key, i) => {
    let value = values[i];
    if (typeof value === "object") value = JSON.stringify(value);
    actionParams[key] = value;
  });
  return mapToPropList(actionParams);
}

export default function* executePluginActionTriggerSaga(
  pluginAction: PluginActionDescription["payload"],
  event: ExecuteActionPayloadEvent,
) {
  const { actionId, params } = pluginAction;
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

    yield put(executeApiActionRequest({ id: pluginAction.actionId }));
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
    AppsmithConsole.info({
      text: "Execution started from widget request",
      source: {
        type: ENTITY_TYPE.ACTION,
        name: api.name,
        id: actionId,
      },
      state: api.actionConfiguration,
    });
    const timeout = yield select(getActionTimeout, actionId);
    const response: ActionExecutionResponse = yield ActionAPI.executeAction(
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
      AppsmithConsole.error({
        logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
        text: `Execution failed with status ${response.data.statusCode}`,
        source: {
          type: ENTITY_TYPE.ACTION,
          name: api.name,
          id: actionId,
        },
        state: response.data?.request ?? null,
        messages: [{ message: payload.body as string }],
      });
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        { failed: true },
        actionId,
      );
      // if (onError) {
      //   yield put(
      //     executeAction({
      //       dynamicString: onError,
      //       event: {
      //         ...event,
      //         type: EventType.ON_ERROR,
      //       },
      //       responseData: [payload.body, params],
      //     }),
      //   );
      // } else {
      //   if (event.callback) {
      //     event.callback({ success: false });
      //   }
      // }
      Toaster.show({
        text: createMessage(ERROR_API_EXECUTE, api.name),
        variant: Variant.danger,
        showDebugButton: true,
      });
    } else {
      PerformanceTracker.stopAsyncTracking(
        PerformanceTransactionName.EXECUTE_ACTION,
        undefined,
        actionId,
      );
      AppsmithConsole.info({
        logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
        text: "Executed successfully from widget request",
        timeTaken: response.clientMeta.duration,
        source: {
          type: ENTITY_TYPE.ACTION,
          name: api.name,
          id: actionId,
        },
        state: {
          response: payload.body,
          request: response.data.request,
        },
      });
      // if (onSuccess) {
      //   yield put(
      //     executeAction({
      //       dynamicString: onSuccess,
      //       event: {
      //         ...event,
      //         type: EventType.ON_SUCCESS,
      //       },
      //       responseData: [payload.body, params],
      //     }),
      //   );
      // } else {
      //   if (event.callback) {
      //     event.callback({ success: true });
      //   }
      // }
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
      showDebugButton: true,
    });
    // if (onError) {
    //   yield put(
    //     executeAction({
    //       dynamicString: `{{${onError}}}`,
    //       event: {
    //         ...event,
    //         type: EventType.ON_ERROR,
    //       },
    //       responseData: [],
    //     }),
    //   );
    // } else {
    //   if (event.callback) {
    //     event.callback({ success: false });
    //   }
    // }
  }
}

function* runActionShortcutSaga() {
  const location = window.location.pathname;
  const match: any = matchPath(location, {
    path: [
      API_EDITOR_URL(),
      API_EDITOR_ID_URL(),
      QUERIES_EDITOR_URL(),
      QUERIES_EDITOR_ID_URL(),
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(),
      INTEGRATION_EDITOR_URL(),
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
  yield put({
    type: ReduxActionTypes.RUN_ACTION_INIT,
    payload: {
      id: actionId,
    },
  });
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

    const response: ActionExecutionResponse = yield ActionAPI.executeAction(
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
        responseTime: response.clientMeta.duration,
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
          timeTaken: response.clientMeta.duration,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: actionObject.name,
            id: actionId,
          },
          state: {
            response: payload.body,
            request: response.data.request,
          },
        });
      } else {
        AppsmithConsole.error({
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          text: `Execution failed with status ${response.data.statusCode}`,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: actionObject.name,
            id: actionId,
          },
          messages: [
            {
              message: !isString(payload.body)
                ? JSON.stringify(payload.body)
                : payload.body,
            },
          ],
          state: response.data?.request ?? null,
        });

        Toaster.show({
          text: createMessage(ERROR_ACTION_EXECUTE_FAIL, actionObject.name),
          variant: Variant.danger,
        });
      }
    } else {
      let error = "An unexpected error occurred";
      if (response.data.body) {
        error = response.data.body.toString();
      }

      AppsmithConsole.error({
        logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
        text: `Execution failed with status ${response.data.statusCode} `,
        source: {
          type: ENTITY_TYPE.ACTION,
          name: actionObject.name,
          id: actionId,
        },
        state: response.data?.request ?? null,
      });

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
    const response: ActionExecutionResponse = yield ActionAPI.executeAction(
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

      AppsmithConsole.error({
        logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
        text: `Execution failed with status ${response.data.statusCode}`,
        source: {
          type: ENTITY_TYPE.ACTION,
          name: pageAction.name,
          id: pageAction.id,
        },
        state: response.data?.request ?? null,
        messages: [{ message: JSON.stringify(body) }],
      });

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

    yield put(executePageLoadActionsComplete());
  } catch (e) {
    log.error(e);

    Toaster.show({
      text: createMessage(ERROR_FAIL_ON_PAGE_LOAD_ACTIONS),
      variant: Variant.danger,
    });
  }
}

function* executePluginActionSaga(
  actionId: string,
  params: Record<string, unknown>,
  paginationField?: PaginationField,
) {
  PerformanceTracker.startAsyncTracking(
    PerformanceTransactionName.EXECUTE_ACTION,
    {
      actionId: actionId,
    },
    actionId,
  );
  const pluginAction: Action = yield select(getAction, actionId);

  if (pluginAction.confirmBeforeExecute) {
    const confirmed = yield call(confirmRunActionSaga);
    if (!confirmed) {
      throw Error("User denied execution of action");
    }
  }

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
  const payload = createActionExecutionResponse(response);

  return {
    payload,
    isError: isErrorResponse(response),
  };
}

export function* watchPluginActionExecutionSagas() {
  yield all([
    takeLatest(ReduxActionTypes.RUN_ACTION_REQUEST, runActionSaga),
    takeLatest(ReduxActionTypes.RUN_ACTION_INIT, runActionInitSaga),
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
