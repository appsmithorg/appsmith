import {
  type DeleteErrorLogPayload,
  type LogDebuggerErrorAnalyticsPayload,
} from "actions/debuggerActions";
import {
  addErrorLogs,
  debuggerLog,
  debuggerLogInit,
  deleteErrorLog,
} from "actions/debuggerActions";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type {
  Log,
  LogActionPayload,
  LogObject,
} from "entities/AppsmithConsole";
import { LOG_CATEGORY, Severity } from "entities/AppsmithConsole";
import { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import {
  all,
  call,
  fork,
  put,
  select,
  take,
  takeEvery,
} from "redux-saga/effects";
import { findIndex, get, isEmpty, isMatch, set } from "lodash";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import {
  getAction,
  getPlugin,
  getJSCollection,
  getAppMode,
} from "ee/selectors/entitiesSelector";
import type { Action } from "entities/Action";
import { PluginType } from "entities/Action";
import type { JSCollection } from "entities/JSCollection";
import LOG_TYPE from "entities/AppsmithConsole/logtype";
import type { ConfigTree } from "entities/DataTree/dataTreeTypes";
import { getConfigTree } from "selectors/dataTreeSelectors";
import { createLogTitleString } from "components/editorComponents/Debugger/helpers";
import AppsmithConsole from "utils/AppsmithConsole";
import { getWidget } from "./selectors";
import AnalyticsUtil, { AnalyticsEventType } from "ee/utils/AnalyticsUtil";
import type { Plugin } from "api/PluginApi";
import { getCurrentPageId } from "selectors/editorSelectors";
import type { WidgetProps } from "widgets/BaseWidget";
import * as log from "loglevel";
import type { TriggerMeta } from "ee/sagas/ActionExecution/ActionExecutionSagas";
import { isWidget } from "ee/workers/Evaluation/evaluationUtils";
import { getCurrentEnvironmentDetails } from "ee/selectors/environmentSelectors";
import { getActiveEditorField } from "selectors/activeEditorFieldSelectors";
import {
  transformAddErrorLogsSaga,
  transformDeleteErrorLogsSaga,
} from "ee/sagas/helpers";
import { identifyEntityFromPath } from "../navigation/FocusEntity";
import { getIDEViewMode } from "../selectors/ideSelectors";
import type { EditorViewMode } from "ee/entities/IDE/constants";
import { getDebuggerPaneConfig } from "../components/editorComponents/Debugger/hooks/useDebuggerTriggerClick";
import { DEBUGGER_TAB_KEYS } from "../components/editorComponents/Debugger/constants";

let blockedSource: string | null = null;

function generateErrorId(error: Log) {
  return error.id + "_" + error.timestamp;
}

// Saga to format action request values to be shown in the debugger
function* formatActionRequestSaga(
  payload: LogActionPayload,
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

function* onTriggerPropertyUpdates(payload: Log[]) {
  const configTree: ConfigTree = yield select(getConfigTree);
  const validLogs = payload.filter(
    (log) => log.source && log.source.propertyPath,
  );

  if (isEmpty(validLogs)) return;

  const errorsPathsToDeleteFromConsole = new Set<string>();

  for (const log of validLogs) {
    const { source } = log;

    if (!source || !source.propertyPath) continue;

    const widget = configTree[source.name];

    // If property is not a trigger property we ignore
    if (!isWidget(widget) || !(source.propertyPath in widget.triggerPaths))
      return false;

    // If the value of the property is empty(or set to 'No Action')
    if (widget[source.propertyPath] === "") {
      errorsPathsToDeleteFromConsole.add(`${source.id}-${source.propertyPath}`);
    }
  }

  const errorIdsToDelete = Array.from(errorsPathsToDeleteFromConsole).map(
    (path) => ({ id: path }),
  );

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
        yield call(onTriggerPropertyUpdates, payload);

        return;
      case LOG_TYPE.ACTION_UPDATE:
      case LOG_TYPE.JS_ACTION_UPDATE:
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

          yield put(debuggerLog(allFormatedLogs));
        }
        break;
      case LOG_TYPE.JS_EXECUTION_ERROR: {
        const filteredLogs = payload.filter(
          (log) => log.source && log.source.propertyPath && log.text,
        );

        yield put(debuggerLog(filteredLogs));
        break;
      }
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
      case LOG_TYPE.MISSING_MODULE:
        yield put(addErrorLogs(payload));
        yield put(debuggerLog(payload));
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
  analyticsPayload: LogDebuggerErrorAnalyticsPayload,
  currentDebuggerErrors: Record<string, Log>,
): unknown {
  try {
    const payload = analyticsPayload;
    const currentPageId: string | undefined = yield select(getCurrentPageId);
    const { source } = payload;
    const activeEditorField: ReturnType<typeof getActiveEditorField> =
      yield select(getActiveEditorField);
    const sourceFullPath = source.name + "." + source.propertyPath || "";

    // To prevent redundant logs for active editor fields
    // We dispatch log events only after the onBlur event of the editor field is fired
    if (sourceFullPath === activeEditorField) {
      if (!blockedSource) {
        blockedSource = sourceFullPath;
        yield fork(
          activeFieldDebuggerErrorHandler,
          analyticsPayload,
          currentDebuggerErrors,
        );
      }

      return;
    }

    if (payload.entityType === ENTITY_TYPE.WIDGET) {
      const widget: WidgetProps | undefined = yield select(
        getWidget,
        payload.entityId,
      );
      const widgetType = widget?.type || payload?.analytics?.widgetType || "";
      const propertyPath = `${widgetType}.${payload.propertyPath}`;

      // Sending widget type for widgets
      AnalyticsUtil.logEvent(
        payload.eventName,
        {
          entityType: widgetType,
          propertyPath,
          errorId: payload.errorId,
          errorMessages: payload.errorMessages,
          pageId: currentPageId,
          errorMessage: payload.errorMessage,
          errorType: payload.errorType,
          appMode: payload.appMode,
        },
        AnalyticsEventType.error,
      );
    } else if (payload.entityType === ENTITY_TYPE.ACTION) {
      const action: Action | undefined = yield select(
        getAction,
        payload.entityId,
      );
      const pluginId = action?.pluginId || payload?.analytics?.pluginId || "";
      const plugin: Plugin = yield select(getPlugin, pluginId);
      const pluginName = plugin?.name.replace(/ /g, "");
      let propertyPath = `${pluginName}`;

      if (payload.propertyPath) {
        propertyPath += `.${payload.propertyPath}`;
      }

      // Sending plugin name for actions
      AnalyticsUtil.logEvent(
        payload.eventName,
        {
          entityType: pluginName,
          propertyPath,
          errorId: payload.errorId,
          errorMessages: payload.errorMessages,
          pageId: currentPageId,
          errorMessage: payload.errorMessage,
          errorType: payload.errorType,
          errorSubType: payload.errorSubType,
          appMode: payload.appMode,
        },
        AnalyticsEventType.error,
      );
    } else if (payload.entityType === ENTITY_TYPE.JSACTION) {
      const action: JSCollection = yield select(
        getJSCollection,
        payload.entityId,
      );

      if (!action) return;

      const plugin: Plugin = yield select(getPlugin, action.pluginId);
      const pluginName = plugin?.name?.replace(/ /g, "");

      // Sending plugin name for actions
      AnalyticsUtil.logEvent(
        payload.eventName,
        {
          entityType: pluginName,
          errorId: payload.errorId,
          propertyPath: payload.propertyPath,
          errorMessages: payload.errorMessages,
          pageId: currentPageId,
          appMode: payload.appMode,
        },
        AnalyticsEventType.error,
      );
    }
  } catch (e) {
    log.error(e);
  }
}

function* addDebuggerErrorLogsSaga(action: ReduxAction<Log[]>) {
  const errorLogs: Log[] = yield call(
    transformAddErrorLogsSaga,
    action.payload,
  );
  const currentDebuggerErrors: Record<string, Log> =
    yield select(getDebuggerErrors);
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);

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

      yield fork(
        logDebuggerErrorAnalyticsSaga,
        {
          ...analyticsPayload,
          eventName: "DEBUGGER_NEW_ERROR",
          errorMessages,
          appMode,
          source,
          logId: id,
        } as LogDebuggerErrorAnalyticsPayload,
        currentDebuggerErrors,
      );

      // Log analytics for new error messages
      //errorID has timestamp for 1:1 mapping with new and resolved errors
      if (errorMessages.length && errorLog) {
        const currentEnvDetails: { id: string; name: string } = yield select(
          getCurrentEnvironmentDetails,
        );

        yield all(
          errorMessages.map((errorMessage) =>
            fork(
              logDebuggerErrorAnalyticsSaga,
              {
                ...analyticsPayload,
                environmentId: currentEnvDetails.id,
                environmentName: currentEnvDetails.name,
                eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
                errorId: generateErrorId(errorLog),
                errorMessage: errorMessage.message,
                errorType: errorMessage.type,
                errorSubType: errorMessage.subType,
                appMode,
                source,
                logId: id,
              } as LogDebuggerErrorAnalyticsPayload,
              currentDebuggerErrors,
            ),
          ),
        );
      }
    } else {
      const updatedErrorMessages = messages ?? [];
      const existingErrorMessages = currentDebuggerErrors[id].messages ?? [];
      const currentEnvDetails: { id: string; name: string } = yield select(
        getCurrentEnvironmentDetails,
      );

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
            //errorID has timestamp for 1:1 mapping with new and resolved errors
            return fork(
              logDebuggerErrorAnalyticsSaga,
              {
                ...analyticsPayload,
                environmentId: currentEnvDetails.id,
                environmentName: currentEnvDetails.name,
                eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
                errorId: generateErrorId(errorLog),
                errorMessage: updatedErrorMessage.message,
                errorType: updatedErrorMessage.type,
                errorSubType: updatedErrorMessage.subType,
                appMode,
                source,
                logId: id,
              } as LogDebuggerErrorAnalyticsPayload,
              currentDebuggerErrors,
            );
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
            //errorID has timestamp for 1:1 mapping with new and resolved errors
            return fork(
              logDebuggerErrorAnalyticsSaga,
              {
                ...analyticsPayload,
                environmentId: currentEnvDetails.id,
                environmentName: currentEnvDetails.name,
                eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
                errorId: generateErrorId(currentDebuggerErrors[id]),
                errorMessage: existingErrorMessage.message,
                errorType: existingErrorMessage.type,
                errorSubType: existingErrorMessage.subType,
                appMode,
                source,
                logId: id,
              } as LogDebuggerErrorAnalyticsPayload,
              currentDebuggerErrors,
            );
          }
        }),
      );
    }
  }
}

function* deleteDebuggerErrorLogsSaga(
  action: ReduxAction<DeleteErrorLogPayload>,
) {
  const payload: DeleteErrorLogPayload = yield call(
    transformDeleteErrorLogsSaga,
    action.payload,
  );
  const currentDebuggerErrors: Record<string, Log> =
    yield select(getDebuggerErrors);
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
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

    yield fork(
      logDebuggerErrorAnalyticsSaga,
      {
        ...analyticsPayload,
        eventName: "DEBUGGER_RESOLVED_ERROR",
        errorMessages,
        appMode,
        source: error.source,
        logId: error.id,
      } as LogDebuggerErrorAnalyticsPayload,
      currentDebuggerErrors,
    );

    if (errorMessages) {
      const currentEnvDetails: { id: string; name: string } = yield select(
        getCurrentEnvironmentDetails,
      );

      //errorID has timestamp for 1:1 mapping with new and resolved errors
      yield all(
        errorMessages.map((errorMessage) => {
          return fork(
            logDebuggerErrorAnalyticsSaga,
            {
              ...analyticsPayload,
              environmentId: currentEnvDetails.id,
              environmentName: currentEnvDetails.name,
              eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
              errorId: generateErrorId(error),
              errorMessage: errorMessage.message,
              errorType: errorMessage.type,
              errorSubType: errorMessage.subType,
              appMode,
              source: error.source,
              logId: error.id,
            } as LogDebuggerErrorAnalyticsPayload,
            currentDebuggerErrors,
          );
        }),
      );
    }
  }

  const validErrorIds = validErrorPayloadsToDelete.map((payload) => payload.id);

  yield put(deleteErrorLog(validErrorIds));
}

// takes a log object array and stores it in the redux store
export function* storeLogs(logs: LogObject[]) {
  AppsmithConsole.addLogs(
    logs
      .filter((log) => {
        if (log.severity === Severity.ERROR) {
          return log.source;
        }

        return true;
      })
      .map((log: LogObject) => {
        return {
          text: `console.${log.method}(${createLogTitleString(log.data)})`,
          logData: log.data,
          source: log.source,
          severity: log.severity,
          timestamp: log.timestamp,
          category: LOG_CATEGORY.USER_GENERATED,
          isExpanded: false,
        };
      }),
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

// This function handles logging of debugger error events for active editor fields
// Error logs are fired only after the editor gets blur
function* activeFieldDebuggerErrorHandler(
  analyticsPayload: LogDebuggerErrorAnalyticsPayload,
  currentDebuggerErrors: Record<string, Log>,
) {
  const { logId, source } = analyticsPayload;
  const initialSourceDebuggerError: Log = currentDebuggerErrors[logId];
  const sourceMetaData = {
    entityName: source.name,
    entityType: source.type,
    entityId: source.id,
    propertyPath: source.propertyPath ?? "",
    source: source,
  };
  const appMode: ReturnType<typeof getAppMode> = yield select(getAppMode);
  const currentEnvDetails: { id: string; name: string } = yield select(
    getCurrentEnvironmentDetails,
  );
  const envMetaData = {
    appMode,
    environmentId: currentEnvDetails.id,
    environmentName: currentEnvDetails.name,
  };

  yield take(ReduxActionTypes.RESET_ACTIVE_EDITOR_FIELD);

  const latestDebuggerErrors: Record<string, Log> =
    yield select(getDebuggerErrors);
  const latestSourceDebuggerError: Log = latestDebuggerErrors[logId];

  blockedSource = null;

  if (!initialSourceDebuggerError && latestSourceDebuggerError) {
    yield fork(
      logDebuggerErrorAnalyticsSaga,
      {
        ...sourceMetaData,
        ...envMetaData,
        eventName: "DEBUGGER_NEW_ERROR",
        errorMessages: latestSourceDebuggerError.messages,
        errorId: generateErrorId(latestSourceDebuggerError),
      } as LogDebuggerErrorAnalyticsPayload,
      latestDebuggerErrors,
    );

    yield all(
      latestSourceDebuggerError.messages?.map((errorMessage) =>
        fork(
          logDebuggerErrorAnalyticsSaga,
          {
            ...sourceMetaData,
            ...envMetaData,
            eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
            errorId: generateErrorId(latestSourceDebuggerError),
            errorMessage: errorMessage.message,
            errorType: errorMessage.type,
            errorSubType: errorMessage.subType,
          } as LogDebuggerErrorAnalyticsPayload,
          currentDebuggerErrors,
        ),
      ) || [],
    );
  }

  if (!latestSourceDebuggerError && initialSourceDebuggerError) {
    yield fork(
      logDebuggerErrorAnalyticsSaga,
      {
        ...sourceMetaData,
        ...envMetaData,
        eventName: "DEBUGGER_RESOLVED_ERROR",
        errorMessages: initialSourceDebuggerError.messages,
        errorId: generateErrorId(initialSourceDebuggerError),
      } as LogDebuggerErrorAnalyticsPayload,
      latestDebuggerErrors,
    );

    yield all(
      initialSourceDebuggerError.messages?.map((errorMessage) => {
        return fork(
          logDebuggerErrorAnalyticsSaga,
          {
            ...sourceMetaData,
            ...envMetaData,
            eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
            errorMessage: errorMessage.message,
            errorId: generateErrorId(initialSourceDebuggerError),
          } as LogDebuggerErrorAnalyticsPayload,
          latestDebuggerErrors,
        );
      }) || [],
    );
  }

  if (latestSourceDebuggerError && initialSourceDebuggerError) {
    const latestErrorMessages = latestSourceDebuggerError.messages || [];
    const initialErrorMessages = initialSourceDebuggerError.messages || [];

    yield all(
      initialErrorMessages.map((initialErrorMessage) => {
        const exists = findIndex(latestErrorMessages, (latestErrorMessage) => {
          return isMatch(latestErrorMessage, initialErrorMessage);
        });

        if (exists < 0) {
          return put({
            type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
            payload: {
              ...sourceMetaData,
              ...envMetaData,
              eventName: "DEBUGGER_RESOLVED_ERROR_MESSAGE",
              errorMessage: initialErrorMessage.message,
              errorId: generateErrorId(initialSourceDebuggerError),
            },
          });
        }
      }),
    );
    yield all(
      latestErrorMessages.map((latestErrorMessage) => {
        const exists = findIndex(
          initialErrorMessages,
          (initialErrorMessage) => {
            return isMatch(initialErrorMessage, latestErrorMessage);
          },
        );

        if (exists < 0) {
          return fork(
            logDebuggerErrorAnalyticsSaga,
            {
              ...sourceMetaData,
              ...envMetaData,
              eventName: "DEBUGGER_NEW_ERROR_MESSAGE",
              errorMessage: latestErrorMessage.message,
              errorType: latestErrorMessage.type,
              errorSubType: latestErrorMessage.subType,
              errorId: generateErrorId(latestSourceDebuggerError),
            } as LogDebuggerErrorAnalyticsPayload,
            currentDebuggerErrors,
          );
        }
      }),
    );
  }
}

function* showDebuggerOnExecutionError() {
  const currentEntity = identifyEntityFromPath(location.pathname);
  const ideState: EditorViewMode = yield select(getIDEViewMode);

  const config = getDebuggerPaneConfig(currentEntity, ideState);

  yield put(
    config.set({ open: true, selectedTab: DEBUGGER_TAB_KEYS.LOGS_TAB }),
  );
}

export default function* debuggerSagasListeners() {
  yield all([
    takeEvery(ReduxActionTypes.DEBUGGER_LOG_INIT, debuggerLogSaga),
    takeEvery(
      ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG_INIT,
      addDebuggerErrorLogsSaga,
    ),
    takeEvery(
      ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG_INIT,
      deleteDebuggerErrorLogsSaga,
    ),
    takeEvery(
      ReduxActionTypes.SHOW_DEBUGGER_LOGS,
      showDebuggerOnExecutionError,
    ),
  ]);
}
