import {
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
  select,
  take,
  takeEvery,
  takeLatest,
} from "redux-saga/effects";
import {
  evaluateDataTreeWithFunctions,
  evaluateDataTreeWithoutFunctions,
} from "selectors/dataTreeSelectors";
import {
  getDynamicBindings,
  getDynamicValue,
  isDynamicValue,
} from "utils/DynamicBindingUtils";
import {
  ActionDescription,
  RunActionPayload,
} from "entities/DataTree/dataTreeFactory";
import { AppToaster } from "components/editorComponents/ToastComponent";
import { executeAction, executeActionError } from "actions/widgetActions";
import {
  getCurrentApplicationId,
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

function* navigateActionSaga(
  action: { pageNameOrUrl: string; params: Record<string, string> },
  event: ExecuteActionPayloadEvent,
) {
  const pageList = yield select(getPageList);
  const applicationId = yield select(getCurrentApplicationId);
  const page = _.find(pageList, { pageName: action.pageNameOrUrl });
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
  log.debug("Evaluating data tree to get action binding value");
  const tree = yield select(evaluateDataTreeWithoutFunctions);
  const dynamicResult = getDynamicValue(`{{${path}}}`, tree);
  return dynamicResult.result;
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
  try {
    yield put(executeApiActionRequest({ id: apiAction.actionId }));
    const api: RestAction = yield select(getAction, actionId);
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
    const executeActionRequest: ExecuteActionRequest = {
      action: { id: actionId },
      params: actionParams,
      paginationField: pagination,
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
  log.debug("Evaluating data tree to get action trigger");
  log.debug({ dynamicString });
  const tree = yield select(evaluateDataTreeWithFunctions);
  log.debug({ tree });
  const { triggers } = getDynamicValue(dynamicString, tree, responseData, true);
  log.debug({ triggers });
  if (triggers && triggers.length) {
    yield all(
      triggers.map(trigger => call(executeActionTriggers, trigger, event)),
    );
  } else {
    if (event.callback) event.callback({ success: true });
  }
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
    const action: ExecuteActionRequest["action"] = { id: actionId };
    const jsonPathKeys = actionObject.jsonPathKeys;

    const { paginationField } = reduxAction.payload;

    const params = yield call(getActionParams, jsonPathKeys);
    const timeout = yield select(getActionTimeout, actionId);
    const response: ActionApiResponse = yield ActionAPI.executeAction(
      {
        action,
        params,
        paginationField,
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
    pageAction.timeoutInMillisecond,
  );

  if (isErrorResponse(response)) {
    yield put(
      executeActionError({
        actionId: pageAction.id,
        error: response.responseMeta.error,
      }),
    );
  } else {
    const payload = createActionExecutionResponse(response);
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
    // Load all sets in parallel
    yield* yield all(actionSet.map(a => call(executePageLoadAction, a)));
  }
}

export function* watchActionExecutionSagas() {
  yield all([
    takeEvery(ReduxActionTypes.EXECUTE_ACTION, executeAppAction),
    takeLatest(ReduxActionTypes.RUN_ACTION_REQUEST, runActionSaga),
    takeLatest(
      ReduxActionTypes.EXECUTE_PAGE_LOAD_ACTIONS,
      executePageLoadActionsSaga,
    ),
  ]);
}
