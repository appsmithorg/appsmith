import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { Log, Message, SourceEntity } from "entities/AppsmithConsole";
import type { ENTITY_TYPE } from "ee/entities/AppsmithConsole/utils";
import type {
  CanvasDebuggerState,
  DebuggerContext,
} from "reducers/uiReducers/debuggerReducer";
import type { EventName } from "ee/utils/analyticsUtilTypes";
import type { APP_MODE } from "entities/App";
import type { GenericEntityItem } from "ee/entities/IDE/constants";

export interface LogDebuggerErrorAnalyticsPayload {
  entityName: string;
  entityId: string;
  entityType: ENTITY_TYPE;
  eventName: EventName;
  propertyPath: string;
  errorId?: string;
  errorMessages?: Message[];
  errorMessage?: Message["message"];
  errorType?: Message["type"];
  errorSubType?: Message["subType"];
  analytics?: Log["analytics"];
  appMode: APP_MODE;
  source: SourceEntity;
  logId: string;
  environmentId?: string;
  environmentName?: string;
}

export type DeleteErrorLogPayload = {
  id: string;
  analytics?: Log["analytics"];
}[];

export const debuggerLogInit = (payload: Log[]) => ({
  type: ReduxActionTypes.DEBUGGER_LOG_INIT,
  payload,
});

export const debuggerLog = (payload: Log[]) => ({
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
export const addErrorLogInit = (payload: Log[]) => ({
  type: ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG_INIT,
  payload,
});

export const addErrorLogs = (payload: Log[]) => ({
  type: ReduxActionTypes.DEBUGGER_ADD_ERROR_LOGS,
  payload,
});

export const deleteErrorLogsInit = (payload: DeleteErrorLogPayload) => ({
  type: ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG_INIT,
  payload,
});

export const deleteErrorLog = (ids: string[]) => ({
  type: ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG,
  payload: ids,
});

export const hideDebuggerErrors = (payload: boolean) => ({
  type: ReduxActionTypes.HIDE_DEBUGGER_ERRORS,
  payload,
});

// set the selected tab in the debugger.
export const setDebuggerSelectedTab = (selectedTab: string) => {
  return {
    type: ReduxActionTypes.SET_DEBUGGER_SELECTED_TAB,
    selectedTab,
  };
};

// set the selected filter in the debugger.
export const setDebuggerSelectedFilter = (selectedFilter: string) => {
  return {
    type: ReduxActionTypes.SET_DEBUGGER_SELECTED_FILTER,
    selectedFilter,
  };
};

// set the height of the response pane in the debugger.
export const setResponsePaneHeight = (height: number) => {
  return {
    type: ReduxActionTypes.SET_RESPONSE_PANE_HEIGHT,
    height,
  };
};

// set the height of the response pane in the debugger.
export const setErrorCount = (count: number) => {
  return {
    type: ReduxActionTypes.SET_ERROR_COUNT,
    count,
  };
};

// set the height of the response pane in the debugger.
export const setResponsePaneScrollPosition = (position: number) => {
  return {
    type: ReduxActionTypes.SET_RESPONSE_PANE_SCROLL_POSITION,
    position,
  };
};

//toggle expand error log item state.
export const toggleExpandErrorLogItem = (id: string, isExpanded: boolean) => {
  return {
    type: ReduxActionTypes.TOGGLE_EXPAND_ERROR_LOG_ITEM,
    payload: { id, isExpanded },
  };
};

//set the debugger context in store.
export const setDebuggerContext = (context: DebuggerContext) => {
  return {
    type: ReduxActionTypes.SET_DEBUGGER_CONTEXT,
    payload: { context },
  };
};

export const setCanvasDebuggerState = (
  payload: Partial<CanvasDebuggerState>,
) => {
  return {
    type: ReduxActionTypes.SET_CANVAS_DEBUGGER_STATE,
    payload,
  };
};

export const showDebuggerLogs = () => {
  return {
    type: ReduxActionTypes.SHOW_DEBUGGER_LOGS,
  };
};

export const setDebuggerStateInspectorSelectedItem = (
  payload: GenericEntityItem,
) => {
  return {
    type: ReduxActionTypes.SET_DEBUGGER_STATE_INSPECTOR_SELECTED_ITEM,
    payload,
  };
};
