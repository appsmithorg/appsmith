import { createImmerReducer } from "utils/ReducerUtils";
import { Log } from "entities/AppsmithConsole";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { omit, isUndefined, isEmpty } from "lodash";
import equal from "fast-deep-equal";

const initialState: DebuggerReduxState = {
  logs: [],
  isOpen: false,
  errors: {},
  expandId: "",
  hideErrors: true,
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
          omit(lastLog, ["occurrenceCount"]),
          omit(incomingLog, ["occurrenceCount"]),
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
});

export interface DebuggerReduxState {
  logs: Log[];
  isOpen: boolean;
  errors: Record<string, Log>;
  expandId: string;
  hideErrors: boolean;
}

export default debuggerReducer;
