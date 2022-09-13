import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "@appsmith/constants/ReduxActionConstants";

const initialState: ImportReduxState = {
  isImportingCurl: false,
  errorPayload: {},
};

const importReducer = createReducer(initialState, {
  [ReduxActionTypes.SUBMIT_CURL_FORM_INIT]: (state: ImportReduxState) => {
    return {
      ...state,
      isImportingCurl: true,
    };
  },
  [ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS]: (state: ImportReduxState) => ({
    ...state,
    isImportingCurl: false,
  }),
  [ReduxActionErrorTypes.SUBMIT_CURL_FORM_ERROR]: (
    state: ImportReduxState,
    action: ReduxAction<{ errorPayload: string }>,
  ) => {
    return { ...state, errorPayload: action.payload, isImportingCurl: false };
  },
});

export interface ImportReduxState {
  isImportingCurl: boolean;
  errorPayload: Record<string, unknown>;
}

export default importReducer;
