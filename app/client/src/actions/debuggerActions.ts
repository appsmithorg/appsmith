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
  errorSubType?: Message["subType"];
  analytics?: Log["analytics"];
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

// Add an error
export const addErrorLogInit = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG_INIT,
  payload,
});

export const addErrorLog = (payload: Log) => ({
  type: ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG,
  payload,
});

export const deleteErrorLogInit = (
  id: string,
  analytics?: Log["analytics"],
) => ({
  type: ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG_INIT,
  payload: {
    id,
    analytics,
  },
});

export const deleteErrorLog = (id: string) => ({
  type: ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG,
  payload: id,
});

// Only used for analytics
export const logDebuggerErrorAnalytics = (
  payload: LogDebuggerErrorAnalyticsPayload,
) => ({
  type: ReduxActionTypes.DEBUGGER_ERROR_ANALYTICS,
  payload,
});

export const hideDebuggerErrors = (payload: boolean) => ({
  type: ReduxActionTypes.HIDE_DEBUGGER_ERRORS,
  payload,
});

export const setCurrentTab = (payload: string) => ({
  type: ReduxActionTypes.SET_CURRENT_DEBUGGER_TAB,
  payload,
});
