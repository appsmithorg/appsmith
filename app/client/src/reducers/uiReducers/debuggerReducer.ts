import { createReducer } from "utils/AppsmithUtils";
import { Severity } from "entities/AppsmithConsole";

const initialState: any = {
  logs: [],
  errorCount: 0,
};

const debuggerReducer = createReducer(initialState, {
  DEBUGGER_LOG: (state: any, action: any) => {
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

export default debuggerReducer;
