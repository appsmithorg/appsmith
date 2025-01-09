import { createReducer } from "utils/ReducerUtils";
import type {
  ReduxAction,
  ReduxActionErrorPayload,
} from "../../actions/ReduxActionTypes";
import { ReduxActionTypes } from "ee/constants/ReduxActionConstants";
import type { ERROR_CODES } from "ee/constants/ApiConstants";
import _ from "lodash";

const initialState: ErrorReduxState = {
  safeCrash: false,
  safeCrashCode: undefined,
  currentError: { sourceAction: "", message: "", stackTrace: "" },
};

const errorReducer = createReducer(initialState, {
  [ReduxActionTypes.SAFE_CRASH_APPSMITH]: (
    state: ErrorReduxState,
    action: ReduxAction<ReduxActionErrorPayload>,
  ) => ({
    ...state,
    safeCrash: true,
    safeCrashCode: _.get(action, "payload.code"),
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
        stackTrace: action.payload.stackTrace,
      },
    };
  },
  [ReduxActionTypes.FLUSH_ERRORS]: () => {
    return initialState;
  },
  [ReduxActionTypes.FETCH_CURRENT_TENANT_CONFIG_SUCCESS]: (
    state: ErrorReduxState,
  ) => {
    if (
      state?.currentError?.sourceAction === "FETCH_CURRENT_TENANT_CONFIG_ERROR"
    ) {
      return {
        ...state,
        ...initialState,
      };
    }

    return state;
  },
  [ReduxActionTypes.UPDATE_TENANT_CONFIG_SUCCESS]: (state: ErrorReduxState) => {
    if (state?.currentError?.sourceAction === "UPDATE_TENANT_CONFIG_ERROR") {
      return {
        ...state,
        ...initialState,
      };
    }

    return state;
  },
});

export interface ErrorReduxState {
  safeCrash: boolean;
  safeCrashCode?: ERROR_CODES;
  currentError: {
    sourceAction?: string;
    message?: string;
    stackTrace?: string;
  };
}

export default errorReducer;
