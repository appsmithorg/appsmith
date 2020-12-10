import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorPayload,
} from "constants/ReduxActionConstants";

const initialState: ErrorReduxState = {
  safeCrash: false,
  currentError: { sourceAction: "", message: "" },
};

const errorReducer = createReducer(initialState, {
  [ReduxActionTypes.SAFE_CRASH_APPSMITH]: (state: ErrorReduxState) => ({
    ...state,
    safeCrash: true,
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
  currentError: {
    sourceAction?: string;
    message?: string;
  };
}

export default errorReducer;
