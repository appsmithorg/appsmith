import { createReducer } from "utils/AppsmithUtils";
import { Log } from "entities/AppsmithConsole";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { omit, isUndefined } from "lodash";

const initialState: DebuggerReduxState = {
  logs: [],
  isOpen: false,
  errors: {},
  expandId: "",
  hideErrors: true,
};

const debuggerReducer = createReducer(initialState, {
  [ReduxActionTypes.DEBUGGER_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Log>,
  ) => {
    return {
      ...state,
      logs: [...state.logs, action.payload],
    };
  },
  [ReduxActionTypes.CLEAR_DEBUGGER_LOGS]: (state: DebuggerReduxState) => {
    return {
      ...state,
      logs: [],
    };
  },
  [ReduxActionTypes.SHOW_DEBUGGER]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean | undefined>,
  ) => {
    return {
      ...state,
      isOpen: isUndefined(action.payload) ? !state.isOpen : action.payload,
    };
  },
  [ReduxActionTypes.DEBUGGER_ADD_ERROR_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Log>,
  ) => {
    if (!action.payload.id) return state;

    return {
      ...state,
      errors: {
        ...state.errors,
        [action.payload.id]: action.payload,
      },
      expandId: action.payload.id,
    };
  },
  [ReduxActionTypes.DEBUGGER_DELETE_ERROR_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      errors: omit(state.errors, action.payload),
    };
  },
  [ReduxActionTypes.HIDE_DEBUGGER_ERRORS]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean>,
  ) => {
    return {
      ...state,
      hideErrors: action.payload,
    };
  },
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: () => {
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
