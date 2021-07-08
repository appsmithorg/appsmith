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

function* formatActionRequestSaga(payload: LogActionPayload, request?: any) {
  if (!payload.source || !payload.state || !request || !request.headers) {
    return;
  }

  const headers = request.headers;

  const source = payload.source;
  const action: Action = yield select(getAction, source.id);
  if (action.pluginType === PluginType.API) {
    let formattedHeaders = [];

    // Convert headers from Record<string, array>[] to Record<string, string>[]
    // for showing in the logs
    formattedHeaders = Object.keys(headers).map((key: string) => {
      const value = headers[key];
      return {
        [key]: value[0],
      };
    });

    return formattedHeaders;
  } else {
    return;
  }
}

function* onEntityDeleteSaga(payload: Message) {
  const source = payload.source;

  if (!source) {
    yield put(debuggerLog(payload));
    return;
  }

  const errors = yield select(getDebuggerErrors);
  const errorIds = Object.keys(errors);
  const updatedErrors: any = {};

  errorIds.map((e) => {
    const includes = e.includes(source.id);

    if (!includes) {
      updatedErrors[e] = errors[e];
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
        const res = yield call(formatActionRequestSaga, payload, payload.state);
        const log = { ...payload };
        res && set(log, "state.headers", res);
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

        yield put(errorLog(log));
        yield put(debuggerLog(log));
      }
      break;
    case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
      {
        const res = yield call(
          formatActionRequestSaga,
          payload,
          payload.state?.request ?? {},
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

        const log = { ...payload };
        res && set(log, "state.request.headers", res);
        yield put(debuggerLog(log));
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
