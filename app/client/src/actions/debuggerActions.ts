import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { Message, ENTITY_TYPE } from "entities/AppsmithConsole";
import { EventName } from "utils/AnalyticsUtil";

export interface LogDebuggerErrorAnalyticsPayload {
  entityName: string;
  entityId: string;
  entityType: ENTITY_TYPE;
  eventName: EventName;
  propertyPath: string;
  errorMessages: { message: string }[];
}

export const debuggerLogInit = (payload: Message) => ({
  type: ReduxActionTypes.DEBUGGER_LOG_INIT,
  payload,
});

export const debuggerLog = (payload: Message) => ({
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

export const errorLog = (payload: Message) => ({
  type: ReduxActionTypes.DEBUGGER_ERROR_LOG,
  payload,
});

export const updateErrorLog = (payload: Message) => ({
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
