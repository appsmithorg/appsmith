import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorPayload,
} from "constants/ReduxActionConstants";
import { ERROR_CODES } from "constants/ApiConstants";

const initialState: ErrorReduxState = {
  safeCrash: false,
  safeCrashCode: undefined,
  currentError: { sourceAction: "", message: "" },
};

const errorReducer = createReducer(initialState, {
  [ReduxActionTypes.SAFE_CRASH_APPSMITH]: (
    state: ErrorReduxState,
    action: ReduxAction<ReduxActionErrorPayload>,
  ) => ({
    ...state,
    safeCrash: true,
    safeCrashCode: action.payload.code,
  }),
  [ReduxActionTypes.REPORT_ERROR]: (
    state: ErrorReduxState,
    action: ReduxAction<ReduxActionErrorPayload>,
  ) => {
    return {
      ...state,
      currentError: {
        sourceAction: action.payload.source,
        message: action.payload.message,
      },
    };
  },
  [ReduxActionTypes.FLUSH_ERRORS]: () => {
    return initialState;
  },
});

export interface ErrorReduxState {
  safeCrash: boolean;
  safeCrashCode?: ERROR_CODES;
  currentError: {
    sourceAction?: string;
    message?: string;
  };
}

export default errorReducer;
