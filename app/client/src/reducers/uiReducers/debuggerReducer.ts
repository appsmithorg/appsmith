import { createReducer } from "utils/AppsmithUtils";
import { Message, Severity } from "entities/AppsmithConsole";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { get, merge, isEmpty, omit, isUndefined } from "lodash";
import LOG_TYPE from "entities/AppsmithConsole/logtype";

const initialState: DebuggerReduxState = {
  logs: [],
  errorCount: 0,
  isOpen: false,
  errors: {},
  expandId: "",
};

const debuggerReducer = createReducer(initialState, {
  [ReduxActionTypes.DEBUGGER_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Message>,
  ) => {
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
  [ReduxActionTypes.SHOW_DEBUGGER]: (
    state: DebuggerReduxState,
    action: ReduxAction<boolean | undefined>,
  ) => {
    return {
      ...state,
      isOpen: isUndefined(action.payload) ? !state.isOpen : action.payload,
    };
  },
  [ReduxActionTypes.DEBUGGER_ERROR_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Message>,
  ) => {
    if (!action.payload.source) return state;

    const entityId = action.payload.source.id;
    const id =
      action.payload.logType === LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR ||
      action.payload.logType === LOG_TYPE.EVAL_ERROR
        ? `${entityId}-${action.payload.source.propertyPath}`
        : entityId;
    const previousState = get(state.errors, id, {});

    return {
      ...state,
      errors: {
        ...state.errors,
        [id]: {
          ...merge(previousState, action.payload),
        },
      },
      expandId: id,
    };
  },
  [ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOG]: (
    state: DebuggerReduxState,
    action: ReduxAction<Message>,
  ) => {
    if (!action.payload.source) return state;

    const entityId = action.payload.source.id;
    const isWidgetErrorLog =
      action.payload.logType === LOG_TYPE.WIDGET_PROPERTY_VALIDATION_ERROR ||
      action.payload.logType === LOG_TYPE.EVAL_ERROR;
    const id = isWidgetErrorLog
      ? `${entityId}-${action.payload.source.propertyPath}`
      : entityId;

    if (isEmpty(action.payload.state)) {
      return {
        ...state,
        errors: omit(state.errors, id),
      };
    }

    return {
      ...state,
      errors: {
        ...state.errors,
        [id]: {
          ...action.payload,
        },
      },
      expandId: id,
    };
  },
  [ReduxActionTypes.DEBUGGER_UPDATE_ERROR_LOGS]: (
    state: DebuggerReduxState,
    action: ReduxAction<Message>,
  ) => {
    return {
      ...state,
      errors: { ...action.payload },
    };
  },
  [ReduxActionTypes.INIT_CANVAS_LAYOUT]: () => {
    return {
      ...initialState,
    };
  },
});

export interface DebuggerReduxState {
  logs: Message[];
  errorCount: number;
  isOpen: boolean;
  errors: Record<string, Message>;
  expandId: string;
}

export default debuggerReducer;
