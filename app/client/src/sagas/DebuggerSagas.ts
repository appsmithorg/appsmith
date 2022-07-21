import {
  addErrorLog,
  debuggerLog,
  debuggerLogInit,
  deleteErrorLog,
  LogDebuggerErrorAnalyticsPayload,
} from "actions/debuggerActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
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
import {
  getAction,
  getPlugin,
  getJSCollection,
} from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import { JSCollection } from "entities/JSCollection";
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
} from "@appsmith/constants/messages";
import AppsmithConsole from "utils/AppsmithConsole";
import { getWidget } from "./selectors";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { Plugin } from "api/PluginApi";
import { getCurrentPageId } from "selectors/editorSelectors";
import { WidgetProps } from "widgets/BaseWidget";
import * as log from "loglevel";
import { DependencyMap } from "utils/DynamicBindingUtils";

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
  const inverseDependencyMap: DependencyMap = yield select(
    getEvaluationInverseDependencyMap,
  );
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

function* onTriggerPropertyUpdates(payload: Log) {
  const dataTree: DataTree = yield select(getDataTree);
  const source = payload.source;

  if (!source || !source.propertyPath) return;
  const widget = dataTree[source.name];
  // If property is not a trigger property we ignore
  if (!isWidget(widget) || !(source.propertyPath in widget.triggerPaths))
    return;
  // If the value of the property is empty(or set to 'No Action')
  if (widget[source.propertyPath] === "") {
    AppsmithConsole.deleteError(`${source.id}-${source.propertyPath}`);
  }
}

function* debuggerLogSaga(action: ReduxAction<Log>) {
  const { payload } = action;

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      yield call(onTriggerPropertyUpdates, payload);
      return;
    case LOG_TYPE.ACTION_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.JS_ACTION_UPDATE:
      yield put(debuggerLog(payload));
      return;
    case LOG_TYPE.JS_PARSE_ERROR:
      yield put(addErrorLog(payload));
      break;
    case LOG_TYPE.JS_PARSE_SUCCESS:
      AppsmithConsole.deleteError(payload.source?.id ?? "");
      break;
    // @ts-expect-error: Types are not available
    case LOG_TYPE.TRIGGER_EVAL_ERROR:
      yield put(debuggerLog(payload));
    case LOG_TYPE.EVAL_ERROR:
    case LOG_TYPE.EVAL_WARNING:
    case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR:
      if (payload.source && payload.source.propertyPath) {
        if (payload.text) {
          yield put(addErrorLog(payload));
        }
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_ERROR:
      {
        const formattedLog: Log = yield call(
          formatActionRequestSaga,
          payload,
          "state",
        );
        yield put(addErrorLog(formattedLog));
        yield put(debuggerLog(formattedLog));
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      {
        const formattedLog: Log = yield call(
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
    const currentPageId: string | undefined = yield select(getCurrentPageId);

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
        errorSubType: payload.errorSubType,
      });
    } else if (payload.entityType === ENTITY_TYPE.JSACTION) {
      const action: JSCollection = yield select(
        getJSCollection,
        payload.entityId,
      );
      if (!action) return;
      const plugin: Plugin = yield select(getPlugin, action.pluginId);
      const pluginName = plugin?.name?.replace(/ /g, "");

      // Sending plugin name for actions
      AnalyticsUtil.logEvent(payload.eventName, {
        entityType: pluginName,
        propertyPath: payload.propertyPath,
        errorMessages: payload.errorMessages,
        pageId: currentPageId,
      });
    }
  } catch (e) {
    log.error(e);
  }
}

function* addDebuggerErrorLogSaga(action: ReduxAction<Log>) {
  const payload = action.payload;
  const errors: Record<string, Log> = yield select(getDebuggerErrors);

  if (!payload.source || !payload.id) return;

  yield put(debuggerLogInit(payload));

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
              errorSubType: errorMessage.subType,
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
              errorSubType: updatedErrorMessage.subType,
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
              errorSubType: existingErrorMessage.subType,
            },
          });
        }
      }),
    );
  }
}

function* deleteDebuggerErrorLogSaga(
  action: ReduxAction<{ id: string; analytics: Log["analytics"] }>,
) {
  const errors: Record<string, Log> = yield select(getDebuggerErrors);
  // If no error exists with this id
  if (!(action.payload.id in errors)) return;

  const error = errors[action.payload.id];

  if (!error || !error.source) return;

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
            errorSubType: errorMessage.subType,
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
