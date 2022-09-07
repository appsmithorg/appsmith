import { createReducer } from "utils/ReducerUtils";
import { Log } from "entities/AppsmithConsole";
import {
  ReduxAction,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { omit, isUndefined } from "lodash";

const initialState: DebuggerReduxState = {
  logs: [],
  isOpen: false,
  errors: {},
  expandId: "",
  hideErrors: true,
  currentTab: "",
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

    // Moving recent update to the top of the error list
    const errors = omit(state.errors, action.payload.id);
    return {
      ...state,
      errors: {
        [action.payload.id]: action.payload,
        ...errors,
      },
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
  [ReduxActionTypes.SET_CURRENT_DEBUGGER_TAB]: (
    state: DebuggerReduxState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      currentTab: action.payload,
    };
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
  currentTab: string;
}

export default debuggerReducer;
