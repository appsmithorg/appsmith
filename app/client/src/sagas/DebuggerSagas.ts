import {
  debuggerLog,
  errorLog,
  logDebuggerErrorAnalytics,
  LogDebuggerErrorAnalyticsPayload,
  updateErrorLog,
} from "actions/debuggerActions";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import {
  ENTITY_TYPE,
  LogActionPayload,
  Message,
} from "entities/AppsmithConsole";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { get, set } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import {
  getAction,
  getPlugin,
  getPluginNameFromId,
  getJSAction,
} from "selectors/entitiesSelector";
import { Action, PluginType } from "entities/Action";
import { JSAction } from "entities/JSAction";
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

function* onEntityDeleteSaga(payload: Message) {
  const source = payload.source;

  if (!source) {
    yield put(debuggerLog(payload));
    return;
  }
  const currentPageId = yield select(getCurrentPageId);
  let pluginName: string = yield select(
    getPluginNameFromId,
    payload?.analytics?.pluginId,
  );

  const errors: Record<string, Message> = yield select(getDebuggerErrors);
  const errorIds = Object.keys(errors);
  const updatedErrors: any = {};

  errorIds.map((e) => {
    const includes = e.includes(source.id);

    if (!includes) {
      updatedErrors[e] = errors[e];
    } else {
      // If the error is being removed here
      // need to send an analytics event for the same
      const error = errors[e];
      pluginName = pluginName.replace(/ /g, "");

      if (source.type === ENTITY_TYPE.ACTION) {
        AnalyticsUtil.logEvent("DEBUGGER_RESOLVED_ERROR", {
          entityType: pluginName,
          propertyPath: `${pluginName}.${error.source?.propertyPath ?? ""}`,
          errorMessages: error.messages,
          pageId: currentPageId,
        });
      } else if (source.type === ENTITY_TYPE.WIDGET) {
        const widgetType = error?.analytics?.widgetType;

        AnalyticsUtil.logEvent("DEBUGGER_RESOLVED_ERROR", {
          entityType: widgetType,
          propertyPath: `${widgetType}.${error.source?.propertyPath ?? ""}`,
          errorMessages: error.messages,
          pageId: currentPageId,
        });
      } else if (source.type === ENTITY_TYPE.JSACTION) {
        AnalyticsUtil.logEvent("DEBUGGER_RESOLVED_ERROR", {
          entityType: ENTITY_TYPE.JSACTION,
          propertyPath: `${error.source?.name}`,
          errorMessages: error.messages,
          pageId: currentPageId,
        });
      }
    }
  });

  yield put({
    type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS,
    payload: updatedErrors,
  });
  yield put(debuggerLog(payload));
}

function* logDependentEntityProperties(payload: Message) {
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

function* debuggerLogSaga(action: ReduxAction<Message>) {
  const { payload } = action;
  const debuggerErrors: Record<string, Message> = yield select(
    getDebuggerErrors,
  );

  switch (payload.logType) {
    case LOG_TYPE.WIDGET_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.ACTION_UPDATE:
      yield put(debuggerLog(payload));
      yield call(logDependentEntityProperties, payload);
      return;
    case LOG_TYPE.JS_ACTION_UPDATE:
      yield put(debuggerLog(payload));
      return;
    case LOG_TYPE.JS_PARSE_ERROR:
      yield put(errorLog(payload));
      break;
    case LOG_TYPE.JS_PARSE_SUCCESS:
      yield put(
        updateErrorLog({
          ...payload,
          state: {},
        }),
      );
      break;
    case LOG_TYPE.EVAL_ERROR:
    case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR:
      if (payload.source && payload.source.propertyPath) {
        if (payload.text) {
          yield put(errorLog(payload));

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
        if (!((payload.source?.id as string) in debuggerErrors)) {
          yield put(
            logDebuggerErrorAnalytics({
              eventName: "DEBUGGER_NEW_ERROR",
              errorMessages: payload.messages ?? [],
              entityType: ENTITY_TYPE.ACTION,
              entityId: payload.source?.id ?? "",
              entityName: payload.source?.name ?? "",
              propertyPath: "",
            }),
          );
        }

        yield put(errorLog(formattedLog));
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

        if ((payload.source?.id as string) in debuggerErrors) {
          yield put(
            logDebuggerErrorAnalytics({
              eventName: "DEBUGGER_RESOLVED_ERROR",
              errorMessages:
                debuggerErrors[payload.source?.id ?? ""].messages ?? [],
              entityType: ENTITY_TYPE.ACTION,
              entityId: payload.source?.id ?? "",
              entityName: payload.source?.name ?? "",
              propertyPath: "",
            }),
          );
        }
        yield put(
          updateErrorLog({
            ...payload,
            state: {},
          }),
        );

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
      const widget: WidgetProps = yield select(getWidget, payload.entityId);
      const widgetType = widget.type;
      const propertyPath = `${widgetType}.${payload.propertyPath}`;

      // Sending widget type for widgets
      AnalyticsUtil.logEvent(payload.eventName, {
        entityType: widgetType,
        propertyPath,
        errorMessages: payload.errorMessages,
        pageId: currentPageId,
      });
    } else if (payload.entityType === ENTITY_TYPE.ACTION) {
      const action: Action = yield select(getAction, payload.entityId);
      const plugin: Plugin = yield select(getPlugin, action.pluginId);
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
      });
    } else if (payload.entityType === ENTITY_TYPE.JSACTION) {
      const action: JSAction = yield select(getJSAction, payload.entityId);
      const plugin: Plugin = yield select(getPlugin, action.pluginId);
      const pluginName = plugin.name.replace(/ /g, "");

      // Sending plugin name for actions
      AnalyticsUtil.logEvent(payload.eventName, {
        entityType: pluginName,
        propertyPath: "",
        errorMessages: payload.errorMessages,
        pageId: currentPageId,
      });
    }
  } catch (e) {
    console.error(e);
  }
}

export default function* debuggerSagasListeners() {
  yield all([
    takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga),
    takeEvery(
      ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
      logDebuggerErrorAnalyticsSaga,
    ),
  ]);
}
