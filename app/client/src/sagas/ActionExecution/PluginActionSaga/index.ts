import {
  clearActionResponse,
  executePageLoadActions,
  runAction,
  updateAction,
  updateActionData,
} from "actions/pluginActionActions";
import { all, call, put, select, take, takeLatest } from "redux-saga/effects";

import { toast } from "@appsmith/ads";
import { softRefreshDatasourceStructure } from "actions/datasourceActions";
import { fetchPageAction } from "actions/pageActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import type { PaginationField } from "api/ActionAPI";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import { EMPTY_RESPONSE } from "components/editorComponents/emptyResponse";
import { EventType } from "constants/AppsmithActionConstants/ActionConstants";
import { getAllowedActionAnalyticsKeys } from "constants/AppsmithActionConstants/formConfig/ActionAnalyticsConfig";
import {
  API_EDITOR_BASE_PATH,
  API_EDITOR_ID_PATH,
  API_EDITOR_PATH_WITH_SELECTED_PAGE_ID,
  INTEGRATION_EDITOR_PATH,
  matchQueryBuilderPath,
  QUERIES_EDITOR_BASE_PATH,
  QUERIES_EDITOR_ID_PATH,
} from "constants/routes";
import {
  ACTION_EXECUTION_CANCELLED,
  createMessage,
  ERROR_ACTION_EXECUTE_FAIL,
  ERROR_PLUGIN_ACTION_EXECUTE,
  SWITCH_ENVIRONMENT_SUCCESS,
} from "ee/constants/messages";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE, PLATFORM_ERROR } from "ee/entities/AppsmithConsole/utils";
import { matchBasePath } from "ee/pages/Editor/Explorer/helpers";
import type { ActionData } from "ee/reducers/entityReducers/actionsReducer";
import { getCurrentApplication } from "ee/selectors/applicationSelectors";
import {
  getAction,
  getCurrentActions,
  getCurrentPageNameByActionId,
  getDatasource,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import {
  getCurrentEnvironmentDetails,
  getCurrentEnvironmentName,
} from "ee/selectors/environmentSelectors";
import {
  getActionExecutionAnalytics,
  getActionProperties,
  getPluginActionNameToDisplay,
} from "ee/utils/actionExecutionUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Action } from "entities/Action";
import { ActionExecutionContext } from "entities/Action";
import type { ApplicationPayload } from "entities/Application";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Datasource } from "entities/Datasource";
import { type Plugin } from "entities/Plugin";
import {
  setAttributesToSpan,
  startRootSpan,
} from "instrumentation/generateTraces";
import { isString, set } from "lodash";
import log from "loglevel";
import { SAAS_EDITOR_API_ID_PATH } from "pages/Editor/SaaSEditor/constants";
import {
  changeQuery,
  isActionDirty,
  isActionSaving,
  setPluginActionEditorDebuggerState,
} from "PluginActionEditor/store";
import { ActionRunBehaviour } from "PluginActionEditor/types/PluginActionTypes";
import { matchPath } from "react-router";
import {
  ActionValidationError,
  getErrorAsString,
  PluginTriggerFailureError,
  UserCancelledActionExecutionError,
} from "sagas/ActionExecution/errorUtils";
import { extractClientDefinedErrorMetadata } from "sagas/ErrorSagas";
import {
  getCurrentApplicationId,
  getCurrentBasePageId,
  getCurrentPageId,
  getIsSavingEntity,
} from "selectors/editorSelectors";
import {
  selectGitConnectModalOpen,
  selectGitOpsModalOpen,
} from "selectors/gitModSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import { shouldBeDefined, trimQueryString } from "utils/helpers";
import { getType, Types } from "utils/TypeHelpers";
import type { TRunDescription } from "workers/Evaluation/fns/actionFns";
import { handleStoreOperations } from "../StoreActionSaga";
import {
  executePluginActionSaga,
  type ExecutePluginActionResponse,
} from "./baseExectutePluginSaga";
import { executePageLoadActionsSaga } from "./onPageLoadSaga";

export default function* executePluginActionTriggerSaga(
  pluginAction: TRunDescription,
  eventType: EventType,
) {
  const span = startRootSpan("executePluginActionTriggerSaga");
  const { payload: pluginPayload } = pluginAction;
  const { actionId, onError, params } = pluginPayload;

  if (getType(params) !== Types.OBJECT) {
    throw new ActionValidationError(
      "RUN_PLUGIN_ACTION",
      "params",
      Types.OBJECT,
      getType(params),
    );
  }

  setAttributesToSpan(span, {
    actionId: actionId,
  });

  const action = shouldBeDefined<Action>(
    yield select(getAction, actionId),
    `Action not found for id - ${actionId}`,
  );
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const datasourceId: string = (action?.datasource as any)?.id;
  const plugin: Plugin = yield select(getPlugin, action?.pluginId);
  const currentApp: ApplicationPayload = yield select(getCurrentApplication);

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );

  const pluginActionNameToDisplay = getPluginActionNameToDisplay(action);

  const actionExecutionAnalytics = getActionExecutionAnalytics(
    action,
    plugin,
    params,
    currentApp,
    datasourceId,
  );

  AnalyticsUtil.logEvent("EXECUTE_ACTION", actionExecutionAnalytics);
  const pagination =
    eventType === EventType.ON_NEXT_PAGE
      ? "NEXT"
      : eventType === EventType.ON_PREV_PAGE
        ? "PREV"
        : undefined;

  const executePluginActionResponse: ExecutePluginActionResponse = yield call(
    executePluginActionSaga,
    action,
    pagination,
    params,
    undefined,
    span,
  );
  const { isError, payload } = executePluginActionResponse;

  if (isError) {
    AppsmithConsole.addErrors([
      {
        payload: {
          id: actionId,
          iconId: action.pluginId,
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          text: `Failed execution in ${payload.duration}(ms)`,
          environmentName: currentEnvDetails.name,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: pluginActionNameToDisplay,
            id: actionId,
            httpMethod: action?.actionConfiguration?.httpMethod,
            pluginType: action.pluginType,
          },
          state: {
            error: !isString(payload.body)
              ? JSON.stringify(payload.body)
              : payload.body,
            request: payload.request,
          },
          pluginErrorDetails: payload.pluginErrorDetails,
        },
      },
    ]);
    AnalyticsUtil.logEvent("EXECUTE_ACTION_FAILURE", {
      ...actionExecutionAnalytics,
      ...payload.pluginErrorDetails,
    });

    if (onError) {
      throw new PluginTriggerFailureError(
        createMessage(ERROR_ACTION_EXECUTE_FAIL, pluginActionNameToDisplay),
        [payload.body, params],
      );
    } else {
      throw new PluginTriggerFailureError(
        createMessage(ERROR_PLUGIN_ACTION_EXECUTE, pluginActionNameToDisplay),
        [],
      );
    }
  } else {
    AnalyticsUtil.logEvent("EXECUTE_ACTION_SUCCESS", actionExecutionAnalytics);
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: `Successfully executed in ${payload.duration}(ms)`,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: pluginActionNameToDisplay,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
  }

  return [
    payload.body,
    params,
    {
      isExecutionSuccess: payload.isExecutionSuccess,
      statusCode: payload.statusCode,
      headers: payload.headers,
    },
  ];
}

function* runActionShortcutSaga() {
  const pathname = window.location.pathname;
  const baseMatch = matchBasePath(pathname);

  if (!baseMatch) return;

  // get gitSyncModal status
  const isGitOpsModalOpen: boolean = yield select(selectGitOpsModalOpen);
  const isGitConnectModalOpen: boolean = yield select(
    selectGitConnectModalOpen,
  );

  // if git sync modal is open, prevent action from being executed via shortcut keys.
  if (isGitOpsModalOpen || isGitConnectModalOpen) return;

  const { path } = baseMatch;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const match: any = matchPath(pathname, {
    path: [
      trimQueryString(`${path}${API_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${API_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_BASE_PATH}`),
      trimQueryString(`${path}${QUERIES_EDITOR_ID_PATH}`),
      trimQueryString(`${path}${API_EDITOR_PATH_WITH_SELECTED_PAGE_ID}`),
      trimQueryString(`${path}${INTEGRATION_EDITOR_PATH}`),
      trimQueryString(`${path}${SAAS_EDITOR_API_ID_PATH}`),
    ],
    exact: true,
    strict: false,
  });

  if (!match || !match.params) return;

  const { baseApiId, baseQueryId } = match.params;
  const actionId = baseApiId || baseQueryId;

  if (actionId) {
    yield put(runAction(actionId));
  } else {
    return;
  }
}

interface RunActionError {
  name: string;
  message: string;
  clientDefinedError?: boolean;
}

export function* runActionSaga(
  reduxAction: ReduxAction<{
    id: string;
    paginationField?: PaginationField;
    skipOpeningDebugger: boolean;
    action?: Action;
    actionExecutionContext?: ActionExecutionContext;
  }>,
) {
  const span = startRootSpan("runActionSaga");
  const actionId = reduxAction.payload.id;
  const isSaving: boolean = yield select(isActionSaving(actionId));
  const isDirty: boolean = yield select(isActionDirty(actionId));
  const isSavingEntity: boolean = yield select(getIsSavingEntity);

  if (isSaving || isDirty || isSavingEntity) {
    if (isDirty && !isSaving) {
      yield put(updateAction({ id: actionId }));
      yield take(ReduxActionTypes.UPDATE_ACTION_SUCCESS);
    }
  }

  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  const actionObject =
    reduxAction.payload.action ||
    shouldBeDefined<Action>(
      yield select(getAction, actionId),
      `action not found for id - ${actionId}`,
    );
  const plugin: Plugin = yield select(getPlugin, actionObject?.pluginId);
  const datasource: Datasource = yield select(
    getDatasource,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (actionObject?.datasource as any)?.id,
  );
  const pageName: string = yield select(getCurrentPageNameByActionId, actionId);

  const { paginationField } = reduxAction.payload;

  // open response tab in debugger on exection of action.
  if (!reduxAction.payload.skipOpeningDebugger) {
    yield put(
      setPluginActionEditorDebuggerState({
        open: true,
        selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
      }),
    );
  }

  let payload = EMPTY_RESPONSE;
  let isError = true;
  let error: RunActionError = {
    name: "",
    message: "",
  };

  const pluginActionNameToDisplay = getPluginActionNameToDisplay(actionObject);

  try {
    const executePluginActionResponse: ExecutePluginActionResponse = yield call(
      executePluginActionSaga,
      actionObject,
      paginationField,
      {},
      true,
      span,
    );

    payload = executePluginActionResponse.payload;
    isError = executePluginActionResponse.isError;
  } catch (e) {
    // When running from the pane, we just want to end the saga if the user has
    // cancelled the call. No need to log any errors
    if (e instanceof UserCancelledActionExecutionError) {
      // cancel action but do not throw any error.
      yield put({
        type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
        payload: {
          error: e.name,
          id: reduxAction.payload.id,
          show: false,
        },
      });
      toast.show(
        createMessage(ACTION_EXECUTION_CANCELLED, pluginActionNameToDisplay),
        {
          kind: "error",
        },
      );

      return;
    }

    log.error(e);
    error = { name: (e as Error).name, message: (e as Error).message };

    const clientDefinedErrorMetadata = extractClientDefinedErrorMetadata(e);

    if (clientDefinedErrorMetadata) {
      set(
        payload,
        "statusCode",
        `${clientDefinedErrorMetadata?.statusCode || ""}`,
      );
      set(payload, "request", {});
      set(
        payload,
        "pluginErrorDetails",
        clientDefinedErrorMetadata?.pluginErrorDetails,
      );
      set(error, "clientDefinedError", true);
    }
  }

  // Error should be readable error if present.
  // Otherwise, payload's body.
  // Default to "An unexpected error occurred" if none is available

  const readableError = payload.readableError
    ? {
        name: "PluginExecutionError",
        message: getErrorAsString(payload.readableError),
      }
    : undefined;

  const payloadBodyError = payload.body
    ? {
        name: "PluginExecutionError",
        message: getErrorAsString(payload.body),
      }
    : undefined;

  const clientDefinedError = error.clientDefinedError
    ? {
        name: "PluginExecutionError",
        message: error?.message,
        clientDefinedError: true,
      }
    : undefined;

  const defaultError = {
    name: "PluginExecutionError",
    message: "An unexpected error occurred",
  };

  const allowedActionAnalyticsKeys = getAllowedActionAnalyticsKeys(
    plugin?.packageName,
  );
  const actionAnalyticsPayload = getActionProperties(
    actionObject,
    allowedActionAnalyticsKeys,
  );

  if (isError) {
    error =
      readableError || payloadBodyError || clientDefinedError || defaultError;

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

    AppsmithConsole.addErrors([
      {
        payload: {
          id: actionId,
          iconId: actionObject.pluginId,
          logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
          environmentName: currentEnvDetails.name,
          text: `Failed execution in ${payload.duration}(ms)`,
          source: {
            type: ENTITY_TYPE.ACTION,
            name: pluginActionNameToDisplay,
            id: actionId,
            httpMethod: actionObject?.actionConfiguration?.httpMethod,
            pluginType: actionObject.pluginType,
          },
          state: {
            error: error.message,
            request: payload.request,
          },
          pluginErrorDetails: payload?.pluginErrorDetails,
        },
      },
    ]);

    yield put({
      type: ReduxActionErrorTypes.RUN_ACTION_ERROR,
      payload: {
        error: appsmithConsoleErrorMessageList[0].message,
        id: reduxAction.payload.id,
        show: false,
      },
    });
    AnalyticsUtil.logEvent("EXECUTE_ACTION_FAILURE", {
      actionId,
      actionName: pluginActionNameToDisplay,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      pageName: pageName,
      apiType: "INTERNAL",
      datasourceId: datasource?.id,
      pluginName: plugin?.name,
      isMock: !!datasource?.isMock,
      actionConfig: actionAnalyticsPayload,
      ...payload?.pluginErrorDetails,
      source: reduxAction.payload.actionExecutionContext,
    });

    return;
  }

  AnalyticsUtil.logEvent("EXECUTE_ACTION", {
    actionId,
    actionName: pluginActionNameToDisplay,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
    pageName: pageName,
    responseTime: payload.duration,
    apiType: "INTERNAL",
    datasourceId: datasource?.id,
    pluginName: plugin?.name,
    isMock: !!datasource?.isMock,
    actionConfig: actionAnalyticsPayload,
    source: reduxAction.payload.actionExecutionContext,
    runBehaviour: actionObject?.runBehaviour,
  });

  yield put({
    type: ReduxActionTypes.RUN_ACTION_SUCCESS,
    payload: { [actionId]: payload },
  });

  if (payload.isExecutionSuccess) {
    AppsmithConsole.info({
      logType: LOG_TYPE.ACTION_EXECUTION_SUCCESS,
      text: `Successfully executed in ${payload.duration}(ms)`,
      source: {
        type: ENTITY_TYPE.ACTION,
        name: pluginActionNameToDisplay,
        id: actionId,
      },
      state: {
        response: payload.body,
        request: payload.request,
      },
    });
  }
}

// Function to clear the action responses for the actions which are not runBehaviour: ON_PAGE_LOAD.
function* clearTriggerActionResponse() {
  const currentPageActions: ActionData[] = yield select(getCurrentActions);

  for (const action of currentPageActions) {
    // Clear the action response if the action has data and is not runBehaviour: ON_PAGE_LOAD.
    if (
      action.data &&
      action.config.runBehaviour !== ActionRunBehaviour.ON_PAGE_LOAD
    ) {
      yield put(clearActionResponse(action.config.id));
      yield put(
        updateActionData([
          {
            entityName: action.config.name,
            dataPath: "data",
            data: undefined,
          },
        ]),
      );
    }
  }
}

// Function to soft refresh the all the actions on the page.
function* softRefreshActionsSaga() {
  //get current pageId
  const pageId: string = yield select(getCurrentPageId);
  const applicationId: string = yield select(getCurrentApplicationId);

  // Fetch the page data before refreshing the actions.
  yield put(fetchPageAction(pageId));
  //wait for the page to be fetched.
  yield take([
    ReduxActionErrorTypes.FETCH_PAGE_ERROR,
    ReduxActionTypes.FETCH_PAGE_SUCCESS,
  ]);
  // Clear appsmith store
  yield call(handleStoreOperations, [
    {
      payload: null,
      type: "CLEAR_STORE",
    },
  ]);
  // Clear all the action responses on the page
  yield call(clearTriggerActionResponse);
  //Rerun all the page load actions on the page
  yield put(
    executePageLoadActions(
      ActionExecutionContext.REFRESH_ACTIONS_ON_ENV_CHANGE,
    ),
  );
  try {
    // we fork to prevent the call from blocking
    yield put(softRefreshDatasourceStructure());
  } catch (error) {}
  //This will refresh the query editor with the latest datasource structure.
  // TODO: fix typing of matchQueryBuilderPath, it always returns "any" which can lead to bugs
  const isQueryPane = matchQueryBuilderPath(window.location.pathname);

  //This is reuired only when the query editor is open.
  if (isQueryPane) {
    const basePageId: string = yield select(getCurrentBasePageId);

    yield put(
      changeQuery({
        baseQueryId: isQueryPane.params.baseQueryId,
        basePageId,
        applicationId,
      }),
    );
  }

  const currentEnvName: string = yield select(getCurrentEnvironmentName);

  toast.show(createMessage(SWITCH_ENVIRONMENT_SUCCESS, currentEnvName), {
    kind: "success",
  });
  yield put({ type: ReduxActionTypes.SWITCH_ENVIRONMENT_SUCCESS });
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
    takeLatest(ReduxActionTypes.PLUGIN_SOFT_REFRESH, softRefreshActionsSaga),
  ]);
}
