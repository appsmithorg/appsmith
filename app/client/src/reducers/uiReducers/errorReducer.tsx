import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorPayload,
} from "constants/ReduxActionConstants";

const initialState: ErrorReduxState = { sourceAction: "", message: "" };

const errorReducer = createReducer(initialState, {
  [ReduxActionTypes.REPORT_ERROR]: (
    state: ErrorReduxState,
    action: ReduxAction<ReduxActionErrorPayload>,
  ) => {
    return {
      sourceAction: action.payload.source,
      message: action.payload.message,
    };
  },
  [ReduxActionTypes.FLUSH_ERRORS]: () => {
    return {};
  },
});

export interface ErrorReduxState {
  // Expiration?
  sourceAction?: string;
  message?: string;
}

export default errorReducer;
