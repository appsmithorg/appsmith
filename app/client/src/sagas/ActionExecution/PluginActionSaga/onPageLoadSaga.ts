import { executePluginActionError } from "actions/pluginActionActions";
import { all, call, put, select, take } from "redux-saga/effects";
import { handleExecuteJSFunctionSaga } from "sagas/JSPaneSagas";

import { toast } from "@appsmith/ads";
import { hideDebuggerErrors } from "actions/debuggerActions";
import type { ReduxAction } from "actions/ReduxActionTypes";
import { DEBUGGER_TAB_KEYS } from "components/editorComponents/Debugger/constants";
import { EMPTY_RESPONSE } from "components/editorComponents/emptyResponse";
import type {
  LayoutOnLoadActionErrors,
  PageAction,
} from "constants/AppsmithActionConstants/ActionConstants";
import {
  ACTION_EXECUTION_CANCELLED,
  ACTION_EXECUTION_FAILED,
  createMessage,
  ERROR_FAIL_ON_PAGE_LOAD_ACTIONS,
} from "ee/constants/messages";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import {
  getAppMode,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import {
  getAction,
  getDatasource,
  getJSCollectionFromAllEntities,
  getPlugin,
} from "ee/selectors/entitiesSelector";
import { getCurrentEnvironmentDetails } from "ee/selectors/environmentSelectors";
import {
  getJSActionPathNameToDisplay,
  getPluginActionNameToDisplay,
} from "ee/utils/actionExecutionUtils";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import type { Action } from "entities/Action";
import { ActionExecutionContext } from "entities/Action";
import type { APP_MODE } from "entities/App";
import type { ApplicationPayload } from "entities/Application";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { Datasource } from "entities/Datasource";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { type Plugin, PluginType } from "entities/Plugin";
import { appsmithTelemetry } from "instrumentation";
import {
  endSpan,
  setAttributesToSpan,
  startRootSpan,
} from "instrumentation/generateTraces";
import type { Span } from "instrumentation/types";
import { flatten } from "lodash";
import log from "loglevel";
import { setPluginActionEditorDebuggerState } from "PluginActionEditor/store";
import { ModalType } from "reducers/uiReducers/modalActionReducer";
import { UserCancelledActionExecutionError } from "sagas/ActionExecution/errorUtils";
import { checkAndLogErrorsIfCyclicDependency } from "sagas/helper";
import { requestModalConfirmationSaga } from "sagas/UtilSagas";
import {
  getCurrentPageId,
  getLayoutOnLoadActions,
  getLayoutOnLoadIssues,
} from "selectors/editorSelectors";
import AppsmithConsole from "utils/AppsmithConsole";
import { shouldBeDefined } from "utils/helpers";
import { getIsAnvilEnabledInCurrentApplication } from "../../../layoutSystems/anvil/integrations/selectors";
import type { ActionResponse } from "api/ActionAPI";
import { executePluginActionSaga } from "./baseExectutePluginSaga";

interface ExecutePluginActionResponse {
  payload: ActionResponse;
  isError: boolean;
}

// This gets called for "onPageLoad" JS actions
function* executeOnPageLoadJSAction(pageAction: PageAction) {
  const collectionId: string = pageAction.collectionId || "";
  const pageId: string | undefined = yield select(getCurrentPageId);

  if (!collectionId) return;

  const collection: JSCollection = yield select(
    getJSCollectionFromAllEntities,
    collectionId,
  );

  if (!collection) {
    appsmithTelemetry.captureException(
      new Error(
        "Collection present in layoutOnLoadActions but no collection exists ",
      ),
      {
        errorName: "MissingJSCollection",
        extra: {
          collectionId,
          actionId: pageAction.id,
          pageId,
        },
      },
    );

    return;
  }

  const jsAction = collection.actions.find(
    (action: JSAction) => action.id === pageAction.id,
  );

  if (!!jsAction) {
    if (jsAction.confirmBeforeExecute) {
      const jsActionPathNameToDisplay = getJSActionPathNameToDisplay(
        jsAction,
        collection,
      );
      const modalPayload = {
        name: jsActionPathNameToDisplay,
        modalOpen: true,
        modalType: ModalType.RUN_ACTION,
      };

      const confirmed: boolean = yield call(
        requestModalConfirmationSaga,
        modalPayload,
      );

      if (!confirmed) {
        yield put({
          type: ReduxActionTypes.RUN_ACTION_CANCELLED,
          payload: { id: pageAction.id },
        });

        const jsActionPathNameToDisplay = getJSActionPathNameToDisplay(
          jsAction,
          collection,
        );

        toast.show(
          createMessage(ACTION_EXECUTION_CANCELLED, jsActionPathNameToDisplay),
          {
            kind: "error",
          },
        );

        // Don't proceed to executing the js function
        return;
      }
    }

    const data = {
      action: jsAction,
      collection,
      isExecuteJSFunc: true,
      onPageLoad: true,
    };

    yield call(handleExecuteJSFunctionSaga, data);
  }
}

function* executePageLoadAction(
  pageAction: PageAction,
  span?: Span,
  actionExecutionContext?: ActionExecutionContext,
) {
  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );

  if (pageAction.hasOwnProperty("collectionId")) {
    yield call(executeOnPageLoadJSAction, pageAction);
  } else {
    const pageId: string | undefined = yield select(getCurrentPageId);
    let currentApp: ApplicationPayload = yield select(getCurrentApplication);

    currentApp = currentApp || {};
    const appMode: APP_MODE | undefined = yield select(getAppMode);

    // action is required to fetch the pluginId and pluginType.
    const action = shouldBeDefined<Action>(
      yield select(getAction, pageAction.id),
      `action not found for id - ${pageAction.id}`,
    );

    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const datasourceId: string = (action?.datasource as any)?.id;
    const datasource: Datasource = yield select(getDatasource, datasourceId);
    const plugin: Plugin = yield select(getPlugin, action?.pluginId);
    const isAnvilEnabled: boolean = yield select(
      getIsAnvilEnabledInCurrentApplication,
    );

    AnalyticsUtil.logEvent("EXECUTE_ACTION", {
      type: pageAction.pluginType,
      name: pageAction.name,
      pageId: pageId,
      appMode: appMode,
      appId: currentApp.id,
      onPageLoad: true,
      appName: currentApp.name,
      environmentId: currentEnvDetails.id,
      environmentName: currentEnvDetails.name,
      isExampleApp: currentApp.appIsExample,
      pluginName: plugin?.name,
      datasourceId: datasourceId,
      isMock: !!datasource?.isMock,
      actionId: pageAction?.id,
      inputParams: 0,
      source: !!actionExecutionContext
        ? actionExecutionContext
        : ActionExecutionContext.PAGE_LOAD,
      runBehaviour: action?.runBehaviour,
    });

    const actionName = getPluginActionNameToDisplay(
      pageAction as unknown as Action,
    );

    let payload = EMPTY_RESPONSE;
    let isError = true;
    let error = {
      name: "PluginExecutionError",
      message: createMessage(ACTION_EXECUTION_FAILED, actionName),
    };

    try {
      const executePluginActionResponse: ExecutePluginActionResponse =
        yield call(
          executePluginActionSaga,
          action,
          undefined,
          undefined,
          undefined,
          span,
        );

      payload = executePluginActionResponse.payload;
      isError = executePluginActionResponse.isError;
    } catch (e) {
      log.error(e);

      if (e instanceof UserCancelledActionExecutionError) {
        error = {
          name: "PluginExecutionError",
          message: createMessage(ACTION_EXECUTION_CANCELLED, actionName),
        };
      }
    }

    // open response tab in debugger on exection of action on page load.
    // Only if current page is the page on which the action is executed.
    if (
      window.location.pathname.includes(pageAction.id) &&
      !(isAnvilEnabled && pageAction.pluginType === PluginType.AI)
    )
      yield put(
        setPluginActionEditorDebuggerState({
          open: true,
          selectedTab: DEBUGGER_TAB_KEYS.RESPONSE_TAB,
        }),
      );

    if (isError) {
      AppsmithConsole.addErrors([
        {
          payload: {
            id: pageAction.id,
            iconId: action.pluginId,
            logType: LOG_TYPE.ACTION_EXECUTION_ERROR,
            environmentName: currentEnvDetails.name,
            text: `Failed execution in ${payload.duration}(ms)`,
            source: {
              type: ENTITY_TYPE.ACTION,
              name: actionName,
              id: pageAction.id,
              httpMethod: action?.actionConfiguration?.httpMethod,
              pluginType: action.pluginType,
            },
            state: {
              error:
                payload.pluginErrorDetails?.downstreamErrorMessage ||
                error.message,
              request: payload.request,
            },
            pluginErrorDetails: payload.pluginErrorDetails,
          },
        },
      ]);

      yield put(
        executePluginActionError({
          actionId: pageAction.id,
          isPageLoad: true,
          error: { message: error.message },
          data: payload,
        }),
      );

      AnalyticsUtil.logEvent("EXECUTE_ACTION_FAILURE", {
        type: pageAction.pluginType,
        name: actionName,
        pageId: pageId,
        appMode: appMode,
        appId: currentApp.id,
        onPageLoad: true,
        appName: currentApp.name,
        environmentId: currentEnvDetails.id,
        environmentName: currentEnvDetails.name,
        isExampleApp: currentApp.appIsExample,
        pluginName: plugin?.name,
        datasourceId: datasourceId,
        isMock: !!datasource?.isMock,
        actionId: pageAction?.id,
        inputParams: 0,
        ...payload.pluginErrorDetails,
        source: !!actionExecutionContext
          ? actionExecutionContext
          : ActionExecutionContext.PAGE_LOAD,
      });
    } else {
      AnalyticsUtil.logEvent("EXECUTE_ACTION_SUCCESS", {
        type: pageAction.pluginType,
        name: actionName,
        pageId: pageId,
        appMode: appMode,
        appId: currentApp.id,
        onPageLoad: true,
        appName: currentApp.name,
        environmentId: currentEnvDetails.id,
        environmentName: currentEnvDetails.name,
        isExampleApp: currentApp.appIsExample,
        pluginName: plugin?.name,
        datasourceId: datasourceId,
        isMock: !!datasource?.isMock,
        actionId: pageAction?.id,
        inputParams: 0,
        source: !!actionExecutionContext
          ? actionExecutionContext
          : ActionExecutionContext.PAGE_LOAD,
      });

      yield take(ReduxActionTypes.SET_EVALUATED_TREE);
    }
  }
}

export function* executePageLoadActionsSaga(
  actionPayload: ReduxAction<{
    actionExecutionContext?: ActionExecutionContext;
  }>,
) {
  const span = startRootSpan("executePageLoadActionsSaga");

  try {
    const pageActions: PageAction[][] = yield select(getLayoutOnLoadActions);
    const layoutOnLoadActionErrors: LayoutOnLoadActionErrors[] = yield select(
      getLayoutOnLoadIssues,
    );
    const actionCount = flatten(pageActions).length;

    setAttributesToSpan(span, { numActions: actionCount });

    // when cyclical depedency issue is there,
    // none of the page load actions would be executed
    for (const actionSet of pageActions) {
      // Load all sets in parallel
      // @ts-expect-error: no idea how to type this
      yield* yield all(
        actionSet.map((apiAction) =>
          call(
            executePageLoadAction,
            apiAction,
            span,
            actionPayload.payload.actionExecutionContext,
          ),
        ),
      );
    }

    yield put({
      type: ReduxActionTypes.SET_ONLOAD_ACTION_EXECUTED,
      payload: true,
    });

    // We show errors in the debugger once onPageLoad actions
    // are executed
    yield put(hideDebuggerErrors(false));
    checkAndLogErrorsIfCyclicDependency(layoutOnLoadActionErrors);
  } catch (e) {
    log.error(e);
    AppsmithConsole.error({
      text: createMessage(ERROR_FAIL_ON_PAGE_LOAD_ACTIONS),
    });
  }
  endSpan(span);
}
