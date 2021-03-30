import { createReducer } from "utils/AppsmithUtils";
import { Message, Severity } from "entities/AppsmithConsole";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: DebuggerReduxState = {
  logs: [],
  errorCount: 0,
  isOpen: false,
};

const debuggerReducer = createReducer(initialState, {
  [ReduxActionTypes.DEBUGGER_LOG]: (state: any, action: any) => {
    const isError = action.payload.severity === Severity.ERROR;

    return {
      ...state,
      logs: [...state.logs, action.payload],
      errorCount: isError ? state.errorCount + 1 : state.errorCount,
    };
  },
  [ReduxActionTypes.CLEAR_DEBUGGER_LOGS]: (state: DebuggerReduxState) => {
    return {
      ...state,
      logs: [],
      errorCount: 0,
    };
  },
  [ReduxActionTypes.DEBUGGER_RESET_ERROR_COUNT]: (
    state: DebuggerReduxState,
  ) => {
    return {
      ...state,
      errorCount: 0,
    };
  },
  [ReduxActionTypes.SHOW_DEBUGGER]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      isOpen: action.payload,
    };
  },
});

interface DebuggerReduxState {
  logs: Message[];
  errorCount: number;
  isOpen: boolean;
}

export default debuggerReducer;
