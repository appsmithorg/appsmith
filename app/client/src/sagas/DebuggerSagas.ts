import {
  addErrorLogs,
  debuggerLog,
  debuggerLogInit,
  deleteErrorLog,
  LogDebuggerErrorAnalyticsPayload,
} from "actions/debuggerActions";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import {
  ENTITY_TYPE,
  Log,
  LogActionPayload,
  LogObject,
  LOG_CATEGORY,
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
import { findIndex, flatten, get, isEmpty, isMatch, set } from "lodash";
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
  createLogTitleString,
  getDependencyChain,
} from "components/editorComponents/Debugger/helpers";
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
import { TriggerMeta } from "./ActionExecution/ActionExecutionSagas";
import {
  getEntityNameAndPropertyPath,
  isAction,
  isWidget,
} from "workers/Evaluation/evaluationUtils";

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

function* onEntityDeleteSaga(payload: Log[]) {
  const sortedLogs = payload.reduce(
    (
      sortedLogs: {
        withSource: Log[];
        withoutSource: Log[];
      },
      log,
    ) => {
      return log.source
        ? { ...sortedLogs, withSource: [...sortedLogs.withSource, log] }
        : { ...sortedLogs, withSource: [...sortedLogs.withoutSource, log] };
    },
    {
      withSource: [],
      withoutSource: [],
    },
  );
  if (!isEmpty(sortedLogs.withoutSource)) {
    yield put(debuggerLog(sortedLogs.withoutSource));
  }
  if (isEmpty(sortedLogs.withSource)) return;

  const errors: Record<string, Log> = yield select(getDebuggerErrors);
  const errorIds = Object.keys(errors);
  const logSourceIds = sortedLogs.withSource.map((log) => log.source?.id);

  const errorsToDelete = errorIds.reduce((errorList: Log[], currentId) => {
    const isPresent = logSourceIds.some((id) => id && currentId.includes(id));
    return isPresent ? [...errorList, errors[currentId]] : errorList;
  }, []);

  sortedLogs.withSource.filter(
    (log) => log.source && errorIds.includes(log.source.id),
  );

  if (!isEmpty(errorsToDelete)) {
    const errorPayload = errorsToDelete.map((log) => ({
      id: log.id as string,
      analytics: log.analytics,
    }));
    AppsmithConsole.deleteErrors(errorPayload);
  }
  yield put(debuggerLog(sortedLogs.withSource));
}

function getLogsFromDependencyChain(
  dependencyChain: string[],
  payload: Log,
  dataTree: DataTree,
) {
  return dependencyChain.map((path) => {
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

    return log;
  });
}

function* logDependentEntityProperties(payload: Log[]) {
  const validLogs = payload.filter((log) => log.state && log.source);
  if (isEmpty(validLogs)) return;

  yield take(ReduxActionTypes.SET_EVALUATED_TREE);
  const dataTree: DataTree = yield select(getDataTree);
  const inverseDependencyMap: DependencyMap = yield select(
    getEvaluationInverseDependencyMap,
  );
  const finalPayload: Log[][] = [];

  for (const log of validLogs) {
    const propertyPath = `${log.source?.name}.` + log.source?.propertyPath;
    const dependencyChain = getDependencyChain(
      propertyPath,
      inverseDependencyMap,
    );
    const payloadValue = getLogsFromDependencyChain(
      dependencyChain,
      log,
      dataTree,
    );
    finalPayload.push(payloadValue);
  }

  //logging them all at once rather than updating them individually
  yield put(debuggerLog(flatten(finalPayload)));
}

function* onTriggerPropertyUpdates(payload: Log[]) {
  const dataTree: DataTree = yield select(getDataTree);
  const validLogs = payload.filter(
    (log) => log.source && log.source.propertyPath,
  );
  if (isEmpty(validLogs)) return;

  const errorsPathsToDeleteFromConsole = new Set<string>();

  for (const log of validLogs) {
    const { source } = log;
    if (!source || !source.propertyPath) continue;
    const widget = dataTree[source.name];
    // If property is not a trigger property we ignore
    if (!isWidget(widget) || !(source.propertyPath in widget.triggerPaths))
      return false;
    // If the value of the property is empty(or set to 'No Action')
    if (widget[source.propertyPath] === "") {
      errorsPathsToDeleteFromConsole.add(`${source.id}-${source.propertyPath}`);
    }
  }
  const errorIdsToDelete = Array.from(
    errorsPathsToDeleteFromConsole,
  ).map((path) => ({ id: path }));
  AppsmithConsole.deleteErrors(errorIdsToDelete);
}

function* debuggerLogSaga(action: ReduxAction<Log[]>) {
  const { payload: logs } = action;
  // array of logs without LOG_TYPE and logs which are not handled in switch statement below.
  let otherLogs: Log[] = [];

  // Group logs by LOG_TYPE
  const sortedLogs = logs.reduce(
    (sortedLogs: Record<string, Log[]>, currentLog: Log) => {
      if (currentLog.logType) {
        return sortedLogs.hasOwnProperty(currentLog.logType)
          ? {
              ...sortedLogs,
              [currentLog.logType]: [
                ...sortedLogs[currentLog.logType],
                currentLog,
              ],
            }
          : {
              ...sortedLogs,
              [currentLog.logType]: [currentLog],
            };
      } else {
        otherLogs.push(currentLog);
        return sortedLogs;
      }
    },
    {},
  );
  for (const item in sortedLogs) {
    const logType = Number(item);
    const payload = sortedLogs[item];
    switch (logType) {
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
        yield put(addErrorLogs(payload));
        break;
      case LOG_TYPE.JS_PARSE_SUCCESS: {
        const errorIds = payload.map((log) => ({ id: log.source?.id ?? "" }));
        AppsmithConsole.deleteErrors(errorIds);
        break;
      }
      // @ts-expect-error: Types are not available
      case LOG_TYPE.TRIGGER_EVAL_ERROR:
        yield put(debuggerLog(payload));
      case LOG_TYPE.EVAL_ERROR:
      case LOG_TYPE.LINT_ERROR:
      case LOG_TYPE.EVAL_WARNING:
      case LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR: {
        const filteredLogs = payload.filter(
          (log) => log.source && log.source.propertyPath && log.text,
        );
        yield put(addErrorLogs(filteredLogs));
        break;
      }

      case LOG_TYPE.ACTION_EXECUTION_ERROR:
        {
          const allFormatedLogs: Log[] = [];

          for (const log of payload) {
            const formattedLog: Log = yield call(
              formatActionRequestSaga,
              log,
              "state",
            );
            allFormatedLogs.push(formattedLog);
          }
          yield put(addErrorLogs(allFormatedLogs));
          yield put(debuggerLog(allFormatedLogs));
        }
        break;
      case LOG_TYPE.ACTION_EXECUTION_SUCCESS:
        {
          const allFormatedLogs: Log[] = [];

          for (const log of payload) {
            const formattedLog: Log = yield call(
              formatActionRequestSaga,
              log,
              "state.request",
            );
            allFormatedLogs.push(formattedLog);
          }
          const payloadIds = payload.map((log) => ({
            id: log.source?.id ?? "",
          }));
          AppsmithConsole.deleteErrors(payloadIds);

          yield put(debuggerLog(allFormatedLogs));
        }
        break;
      case LOG_TYPE.ENTITY_DELETED:
        yield fork(onEntityDeleteSaga, payload);
        break;
      default:
        otherLogs = otherLogs.concat(payload);
    }
  }
  if (!isEmpty(otherLogs)) {
    yield put(debuggerLog(otherLogs));
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

function* addDebuggerErrorLogsSaga(action: ReduxAction<Log[]>) {
  const errorLogs = action.payload;
  const currentDebuggerErrors: Record<string, Log> = yield select(
    getDebuggerErrors,
  );
  yield put(debuggerLogInit(errorLogs));
  const validErrorLogs = errorLogs.filter((log) => log.source && log.id);
  if (isEmpty(validErrorLogs)) return;

  for (const errorLog of validErrorLogs) {
    const { id, messages, source } = errorLog;
    if (!source || !id) continue;
    const analyticsPayload = {
      entityName: source.name,
      entityType: source.type,
      entityId: source.id,
      propertyPath: source.propertyPath ?? "",
    };

    // If this is a new error
    if (!currentDebuggerErrors.hasOwnProperty(id)) {
      const errorMessages = errorLog.messages ?? [];

      yield put({
        type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
        payload: {
          ...analyticsPayload,
          eventName: "DEBUGGER_NEW_ERROR",
          errorMessages,
        },
      });

      // Log analytics for new error messages
      if (errorMessages.length && errorLog) {
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
      const updatedErrorMessages = messages ?? [];
      const existingErrorMessages = currentDebuggerErrors[id].messages ?? [];
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
}

function* deleteDebuggerErrorLogsSaga(
  action: ReduxAction<{ id: string; analytics: Log["analytics"] }[]>,
) {
  const { payload } = action;
  const currentDebuggerErrors: Record<string, Log> = yield select(
    getDebuggerErrors,
  );
  const existingErrorPayloads = payload.filter((item) =>
    currentDebuggerErrors.hasOwnProperty(item.id),
  );
  if (isEmpty(existingErrorPayloads)) return;

  const validErrorPayloadsToDelete = existingErrorPayloads.filter((payload) => {
    const existingError = currentDebuggerErrors[payload.id];
    return existingError && existingError.source;
  });

  if (isEmpty(validErrorPayloadsToDelete)) return;

  for (const validErrorPayload of validErrorPayloadsToDelete) {
    const error = currentDebuggerErrors[validErrorPayload.id];
    if (!error || !error.source) continue;
    const analyticsPayload = {
      entityName: error.source.name,
      entityType: error.source.type,
      entityId: error.source.id,
      propertyPath: error.source.propertyPath ?? "",
      analytics: validErrorPayload.analytics,
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
  }
  const validErrorIds = validErrorPayloadsToDelete.map((payload) => payload.id);
  yield put(deleteErrorLog(validErrorIds));
}

// takes a log object array and stores it in the redux store
export function* storeLogs(
  logs: LogObject[],
  entityName: string,
  entityType: ENTITY_TYPE,
  entityId: string,
) {
  AppsmithConsole.addLogs(
    logs.reduce((acc: Log[], log: LogObject) => {
      acc.push({
        text: createLogTitleString(log.data),
        logData: log.data,
        source: {
          type: entityType,
          name: entityName,
          id: entityId,
        },
        severity: log.severity,
        timestamp: log.timestamp,
        category: LOG_CATEGORY.USER_GENERATED,
      });
      return acc;
    }, []),
  );
}

export function* updateTriggerMeta(
  triggerMeta: TriggerMeta,
  dynamicTrigger: string,
) {
  let name = "";

  if (!!triggerMeta.source && triggerMeta.source.hasOwnProperty("name")) {
    name = triggerMeta.source.name;
  } else if (!!triggerMeta.triggerPropertyName) {
    name = triggerMeta.triggerPropertyName;
  }

  if (
    name.length === 0 &&
    !!dynamicTrigger &&
    !(dynamicTrigger.includes("{") || dynamicTrigger.includes("}"))
  ) {
    // We use the dynamic trigger as the name if it is not a binding
    name = dynamicTrigger.replace("()", "");
    triggerMeta["triggerPropertyName"] = name;
  }
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
      addDebuggerErrorLogsSaga,
    ),
    takeEvery(
      ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG_INIT,
      deleteDebuggerErrorLogsSaga,
    ),
  ]);
}
