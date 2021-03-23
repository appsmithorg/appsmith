import { createReducer } from "utils/AppsmithUtils";
import { Message, Severity } from "entities/AppsmithConsole";
import { ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: DebuggerReduxState = {
  logs: [],
  errorCount: 0,
};

const debuggerReducer = createReducer(initialState, {
  [ReduxActionTypes.DEBUGGER_LOG]: (state: any, action: any) => {
    const isError = action.payload.severity === Severity.ERROR;

    return {
      ...state,
      logs: [action.payload, ...state.logs],
      errorCount: isError ? state.errorCount + 1 : state.errorCount,
    };
  },
  DEBUGGER_RESET_ERROR_COUNT: (state: any) => {
    return {
      ...state,
      errorCount: 0,
    };
  },
});

interface DebuggerReduxState {
  logs: Message[];
  errorCount: number;
}

export default debuggerReducer;
