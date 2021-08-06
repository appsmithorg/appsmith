import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ENTITY_TYPE, Log, Message } from "entities/AppsmithConsole";
import { EventName } from "utils/AnalyticsUtil";

export interface LogDebuggerErrorAnalyticsPayload {
  entityName: string;
  entityId: string;
  entityType: ENTITY_TYPE;
  eventName: EventName;
  propertyPath: string;
  errorMessages?: Message[];
  errorMessage?: Message["message"];
  errorType?: Message["type"];
}

export const debuggerLogInit = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_LOG_INIT,
  payload,
});

export const debuggerLog = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_LOG,
  payload,
});

export const clearLogs = () => ({
  type: ReduxActionTypes.CLEAR_DEBUGGER_LOGS,
});

export const showDebugger = (payload?: boolean) => ({
  type: ReduxActionTypes.SHOW_DEBUGGER,
  payload,
});

export const errorLog = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_ERROR_LOG,
  payload,
});

export const updateErrorLog = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOG,
  payload,
});

// Only used for analytics
export const logDebuggerErrorAnalytics = (
  payload: LogDebuggerErrorAnalyticsPayload,
) => ({
  type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
  payload,
});
