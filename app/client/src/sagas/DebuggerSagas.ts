import {
  addErrorLog,
  debuggerLog,
  deleteErrorLog,
  LogDebuggerErrorAnalyticsPayload,
} from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { ENTITY_TYPE, Log, LogActionPayload } from "entities/AppsmithConsole";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { findIndex, get, isMatch, set } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import { getAction, getPlugin } from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import { DataTree } from "entities/DataTree/dataTreeFactory";
import {
  getDataTree,
  getEvaluationInverseDependencyMap,
} from "selectors/dataTreeSelectors";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "workers/evaluationUtils";
import { getDependencyChain } from "components/editorComponents/Debugger/helpers";
import {
  ACTION_CONFIGURATION_UPDATED,
  createMessage,
  WIDGET_PROPERTIES_UPDATED,
} from "constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Plugin } from "api/PluginApi";
import { getCurrentPageId } from "selectors/editorSelectors";
import { getWidget } from "./selectors";
import { WidgetProps } from "widgets/BaseWidget";
import AppsmithConsole from "utils/AppsmithConsole";

// Saga to format action request values to be shown in the debugger
function* formatActionRequestSaga(
  payload: LogActionPayload,
  requestPath?: any,
) {
  // If there are no headers or body we don't format anything.
  if (!payload.source || !payload.state || !requestPath) {
    return payload;
  }

  const request = get(payload, requestPath);

  const source = payload.source;
  const action: Action | undefined = yield select(getAction, source.id);
  // Only formatting for apis and not queries
  if (action && action.pluginType === PluginType.API) {
    // Formatting api headers here
    if (request.headers) {
      let formattedHeaders = [];

      // Convert headers from Record<string, array>[] to Record<string, string>[]
      // for showing in the logs
      formattedHeaders = Object.keys(request.headers).map((key: string) => {
        const value = request.headers[key];
        return {
          [key]: value[0],
        };
      });

      set(payload, `${requestPath}.headers`, formattedHeaders);
    }

    // Formatting api body
    if (request.body) {
      let body = request.body;

      try {
        body = JSON.parse(body);
        set(payload, `${requestPath}.body`, body);
      } catch (e) {
        // Nothing to do here, we show the api body as it is if it cannot be shown as
        // an object
      }
    }

    // Return the final payload to be logged
    return payload;
  } else {
    return payload;
  }
}

function* onEntityDeleteSaga(payload: Log) {
  const source = payload.source;

  if (!source) {
    yield put(debuggerLog(payload));
    return;
  }

  const errors: Record<string, Log> = yield select(getDebuggerErrors);
  const errorIds = Object.keys(errors);

  errorIds.map((e) => {
    const includes = e.includes(source.id);

    if (includes) {
      AppsmithConsole.deleteError(e, payload.analytics);
    }
  });

  yield put(debuggerLog(payload));
}

function* logDependentEntityProperties(payload: Log) {
  const { source, state } = payload;
  if (!state || !source) return;

  yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  const dataTree: DataTree = yield select(getDataTree);

  const propertyPath = `${source.name}.` + payload.source?.propertyPath;
  const inverseDependencyMap = yield select(getEvaluationInverseDependencyMap);
  const finalValue = getDependencyChain(propertyPath, inverseDependencyMap);

  yield all(
    finalValue.map((path) => {
      const entityInfo = getEntityNameAndPropertyPath(path);
      const entity = dataTree[entityInfo.entityName];
      let log = {
        ...payload,
        state: {
          [entityInfo.propertyPath]: get(dataTree, path),
        },
      };

      if (isAction(entity)) {
        log = {
          ...log,
          text: createMessage(ACTION_CONFIGURATION_UPDATED),
          source: {
            type: ENTITY_TYPE.ACTION,
            name: entityInfo.entityName,
            id: entity.actionId,
          },
        };
      } else if (isWidget(entity)) {
        log = {
          ...log,
          text: createMessage(WIDGET_PROPERTIES_UPDATED),
          source: {
            type: ENTITY_TYPE.WIDGET,
            name: entityInfo.entityName,
            id: entity.widgetId,
          },
        };
      }

      return put(debuggerLog(log));
    }),
  );
}

function* debuggerLogSaga(action: ReduxAction<Log>) {
  const { payload } = action;

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.ACTION_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.EVAL_ERROR:
    case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR:
      if (payload.source && payload.source.propertyPath) {
        if (payload.text) {
          yield put(debuggerLog(payload));
        }
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_ERROR:
      {
        const formattedLog = yield call(
          formatActionRequestSaga,
          payload,
          "state",
        );
        AppsmithConsole.addError(formattedLog);
        yield put(debuggerLog(formattedLog));
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      {
        const formattedLog = yield call(
          formatActionRequestSaga,
          payload,
          "state.request",
        );

        AppsmithConsole.deleteError(payload.source?.id ?? "");

        yield put(debuggerLog(formattedLog));
      }
      break;
    case LOG_TYPE.ENTITY_DELETED:
      yield fork(onEntityDeleteSaga, payload);
      break;
    default:
      yield put(debuggerLog(payload));
  }
}

// This saga is intended for analytics only
function* logDebuggerErrorAnalyticsSaga(
  action: ReduxAction<LogDebuggerErrorAnalyticsPayload>,
) {
  try {
    const { payload } = action;
    const currentPageId = yield select(getCurrentPageId);

    if (payload.entityType === ENTITY_TYPE.WIDGET) {
      const widget: WidgetProps | undefined = yield select(
        getWidget,
        payload.entityId,
      );
      const widgetType = widget?.type || payload?.analytics?.widgetType || "";
      const propertyPath = `${widgetType}.${payload.propertyPath}`;

      // Sending widget type for widgets
      AnalyticsUtil.logEvent(payload.eventName, {
        entityType: widgetType,
        propertyPath,
        errorMessages: payload.errorMessages,
        pageId: currentPageId,
        errorMessage: payload.errorMessage,
        errorType: payload.errorType,
      });
    } else if (payload.entityType === ENTITY_TYPE.ACTION) {
      const action: Action | undefined = yield select(
        getAction,
        payload.entityId,
      );
      const pluginId = action?.pluginId || payload?.analytics?.pluginId || "";
      const plugin: Plugin = yield select(getPlugin, pluginId);
      const pluginName = plugin.name.replace(/ /g, "");
      let propertyPath = `${pluginName}`;

      if (payload.propertyPath) {
        propertyPath += `.${payload.propertyPath}`;
      }

      // Sending plugin name for actions
      AnalyticsUtil.logEvent(payload.eventName, {
        entityType: pluginName,
        propertyPath,
        errorMessages: payload.errorMessages,
        pageId: currentPageId,
        errorMessage: payload.errorMessage,
        errorType: payload.errorType,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

function* addDebuggerErrorLogSaga(action: ReduxAction<Log>) {
  const payload = action.payload;
  const errors: Record<string, Log> = yield select(getDebuggerErrors);

  if (!payload.source || !payload.id) return;

  const analyticsPayload = {
    entityName: payload.source.name,
    entityType: payload.source.type,
    entityId: payload.source.id,
    propertyPath: payload.source.propertyPath ?? "",
  };

  // If this is a new error
  if (!(payload.id in errors)) {
    const errorMessages = payload.messages ?? [];

    yield put({
      type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
      payload: {
        ...analyticsPayload,
        eventName: "DEBUGGER_NEW_ERROR",
        errorMessages: payload.messages,
      },
    });

    // Log analytics for new error messages
    if (errorMessages.length && payload) {
      yield all(
        errorMessages.map((errorMessage) =>
          put({
            type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
            payload: {
              ...analyticsPayload,
              eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
              errorMessage: errorMessage.message,
              errorType: errorMessage.type,
            },
          }),
        ),
      );
    }
  } else {
    const updatedErrorMessages = payload.messages ?? [];
    const existingErrorMessages = errors[payload.id].messages ?? [];
    // Log new error messages
    yield all(
      updatedErrorMessages.map((updatedErrorMessage) => {
        const exists = findIndex(
          existingErrorMessages,
          (existingErrorMessage) => {
            return isMatch(existingErrorMessage, updatedErrorMessage);
          },
        );

        if (exists < 0) {
          return put({
            type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
            payload: {
              ...analyticsPayload,
              eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
              errorMessage: updatedErrorMessage.message,
              errorType: updatedErrorMessage.type,
            },
          });
        }
      }),
    );
    // Log resolved error messages
    yield all(
      existingErrorMessages.map((existingErrorMessage) => {
        const exists = findIndex(
          updatedErrorMessages,
          (updatedErrorMessage) => {
            return isMatch(updatedErrorMessage, existingErrorMessage);
          },
        );

        if (exists < 0) {
          return put({
            type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
            payload: {
              ...analyticsPayload,
              eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
              errorMessage: existingErrorMessage.message,
              errorType: existingErrorMessage.type,
            },
          });
        }
      }),
    );
  }

  yield put(addErrorLog(payload));
}

function* deleteDebuggerErrorLogSaga(
  action: ReduxAction<{ id: string; analytics: Log["analytics"] }>,
) {
  const errors: Record<string, Log> = yield select(getDebuggerErrors);
  const error = errors[action.payload.id];

  if (!error.source) return;

  const analyticsPayload = {
    entityName: error.source.name,
    entityType: error.source.type,
    entityId: error.source.id,
    propertyPath: error.source.propertyPath ?? "",
    analytics: action.payload.analytics,
  };
  const errorMessages = error.messages;

  yield put({
    type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
    payload: {
      ...analyticsPayload,
      eventName: "DEBUGGER_RESOLVED_ERROR",
      errorMessages,
    },
  });

  if (errorMessages) {
    yield all(
      errorMessages.map((errorMessage) => {
        return put({
          type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
          payload: {
            ...analyticsPayload,
            eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
            errorMessage: errorMessage.message,
            errorType: errorMessage.type,
          },
        });
      }),
    );
  }

  yield put(deleteErrorLog(action.payload.id));
}

export default function* debuggerSagasListeners() {
  yield all([
    takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga),
    takeEvery(
      ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
      logDebuggerErrorAnalyticsSaga,
    ),
    takeEvery(
      ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG_INIT,
      addDebuggerErrorLogSaga,
    ),
    takeEvery(
      ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG_INIT,
      deleteDebuggerErrorLogSaga,
    ),
  ]);
}
