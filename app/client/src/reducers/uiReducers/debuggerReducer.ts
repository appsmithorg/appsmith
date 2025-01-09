import { createImmerReducer } from "utils/ReducerUtils";
import type { Log } from "entities/AppsmithConsole";
import type { ReduxAction } from "constants/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import { omit, isUndefined, isEmpty } from "lodash";
import equal from "fast-deep-equal";
import { ActionExecutionResizerHeight } from "PluginActionEditor/components/PluginActionResponse/constants";
import { klona } from "klona";
import type { GenericEntityItem } from "ee/entities/IDE/constants";

export const DefaultDebuggerContext = {
  scrollPosition: 0,
  selectedDebuggerTab: "",
  responseTabHeight: ActionExecutionResizerHeight,
  errorCount: 0,
  selectedDebuggerFilter: "",
};

const initialState: DebuggerReduxState = {
  logs: [],
  isOpen: false,
  errors: {},
  expandId: "",
  hideErrors: true,
  context: DefaultDebuggerContext,
  stateInspector: {},
};

// check the last message from the current log and update the occurrence count
const removeRepeatedLogsAndMerge = (
  currentLogs: Log[],
  incomingLogs: Log[],
) => {
  const outputArray = incomingLogs.reduce((acc: Log[], incomingLog: Log) => {
    if (acc.length === 0) {
      acc.push(incomingLog);
    } else {
      const lastLog = acc[acc.length - 1];

      if (
        equal(
          omit(lastLog, ["occurrenceCount", "timestamp"]),
          omit(incomingLog, ["occurrenceCount", "timestamp"]),
        )
      ) {
        lastLog.hasOwnProperty("occurrenceCount") && !!lastLog.occurrenceCount
          ? lastLog.occurrenceCount++
          : (lastLog.occurrenceCount = 2);
      } else {
        acc.push(incomingLog);
      }
    }

    return acc;
  }, currentLogs);

  return outputArray;
};

const debuggerReducer = createImmerReducer(initialState, {
  [ReduxActionTypes.DEBUGGER_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Log[]>,
  ) => {
    // state.logs = [...state.logs, ...action.payload];
    state.logs = removeRepeatedLogsAndMerge(state.logs, action.payload);
  },
  [ReduxActionTypes.CLEAR_DEBUGGER_LOGS]: (state: DebuggerReduxState) => {
    state.logs = [];
  },
  [ReduxActionTypes.SHOW_DEBUGGER]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean | undefined>,
  ) => {
    state.isOpen = isUndefined(action.payload) ? !state.isOpen : action.payload;
  },
  [ReduxActionTypes.DEBUGGER_ADD_ERROR_LOGS]: (
    state: DebuggerReduxState,
    action: ReduxAction<Log[]>,
  ) => {
    const { payload } = action;
    // Remove Logs without IDs
    const validDebuggerErrors = payload.reduce((validLogs, currentLog) => {
      if (!currentLog.id) return validLogs;

      return {
        ...validLogs,
        [currentLog.id]: currentLog,
      };
    }, {});

    if (isEmpty(validDebuggerErrors)) return state;

    // Moving recent update to the top of the error list
    const errors = omit(state.errors, Object.keys(validDebuggerErrors));

    state.errors = {
      ...validDebuggerErrors,
      ...errors,
    };
  },
  [ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<string[]>,
  ) => {
    state.errors = omit(state.errors, action.payload);
  },
  [ReduxActionTypes.HIDE_DEBUGGER_ERRORS]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean>,
  ) => {
    state.hideErrors = action.payload;
  },
  // Resetting debugger state after page switch
  [ReduxActionTypes.SWITCH_CURRENT_PAGE_ID]: () => {
    return {
      ...initialState,
    };
  },
  [ReduxActionTypes.SET_DEBUGGER_SELECTED_TAB]: (
    state: DebuggerReduxState,
    action: { selectedTab: string },
  ) => {
    state.context.selectedDebuggerTab = action.selectedTab;
  },
  [ReduxActionTypes.SET_DEBUGGER_SELECTED_FILTER]: (
    state: DebuggerReduxState,
    action: { selectedFilter: string },
  ) => {
    state.context.selectedDebuggerFilter = action.selectedFilter;
  },
  [ReduxActionTypes.SET_RESPONSE_PANE_HEIGHT]: (
    state: DebuggerReduxState,
    action: { height: number },
  ) => {
    state.context.responseTabHeight = action.height;
  },
  [ReduxActionTypes.SET_ERROR_COUNT]: (
    state: DebuggerReduxState,
    action: { count: number },
  ) => {
    state.context.errorCount = action.count;
  },
  [ReduxActionTypes.SET_RESPONSE_PANE_SCROLL_POSITION]: (
    state: DebuggerReduxState,
    action: { position: number },
  ) => {
    state.context.scrollPosition = action.position;
  },
  [ReduxActionTypes.TOGGLE_EXPAND_ERROR_LOG_ITEM]: (
    state: DebuggerReduxState,
    action: ReduxAction<{ id: string; isExpanded: boolean }>,
  ) => {
    const { id, isExpanded } = action.payload;
    const errors = JSON.parse(JSON.stringify(state.errors));

    errors[id] = { ...errors[id], isExpanded };

    return {
      ...state,
      errors,
    };
  },
  [ReduxActionTypes.SET_DEBUGGER_CONTEXT]: (
    state: DebuggerReduxState,
    action: { context: DebuggerContext },
  ) => {
    state.context = action.context;
  },
  [ReduxActionTypes.SET_CANVAS_DEBUGGER_STATE]: (
    state: DebuggerReduxState,
    action: { payload: Partial<CanvasDebuggerState> },
  ): DebuggerReduxState => {
    return {
      ...state,
      isOpen: "open" in action.payload ? !!action.payload.open : state.isOpen,
      context: {
        ...state.context,
        responseTabHeight:
          "responseTabHeight" in action.payload
            ? Number(action.payload.responseTabHeight)
            : state.context.responseTabHeight,
        selectedDebuggerTab:
          "selectedTab" in action.payload
            ? String(action.payload.selectedTab)
            : state.context.selectedDebuggerTab,
      },
    };
  },
  [ReduxActionTypes.SET_DEBUGGER_STATE_INSPECTOR_SELECTED_ITEM]: (
    state: DebuggerReduxState,
    action: ReduxAction<GenericEntityItem>,
  ): DebuggerReduxState => {
    return {
      ...state,
      stateInspector: {
        selectedItem: action.payload,
      },
    };
  },
  // Resetting debugger state after env switch
  [ReduxActionTypes.SWITCH_ENVIRONMENT_SUCCESS]: () => {
    return klona(initialState);
  },
});

export interface DebuggerReduxState {
  logs: Log[];
  isOpen: boolean;
  errors: Record<string, Log>;
  expandId: string;
  hideErrors: boolean;
  context: DebuggerContext;
  stateInspector: {
    selectedItem?: GenericEntityItem;
  };
}

export interface DebuggerContext {
  scrollPosition: number;
  errorCount: number;
  selectedDebuggerTab: string;
  responseTabHeight: number;
  selectedDebuggerFilter: string;
}

export interface CanvasDebuggerState {
  open: boolean;
  responseTabHeight: number;
  selectedTab?: string;
}

export default debuggerReducer;
