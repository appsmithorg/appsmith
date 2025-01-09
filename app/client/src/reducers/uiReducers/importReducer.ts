import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionTypes,
  ReduxActionErrorTypes,
} from "ee/constants/ReduxActionConstants";

const initialState: ImportReduxState = {
  isCurlModalOpen: false,
  isImportingCurl: false,
  errorPayload: {},
};

const importReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_CURL_MODAL_OPEN]: (state: ImportReduxState) => ({
    ...state,
    isCurlModalOpen: true,
  }),
  [ReduxActionTypes.SET_CURL_MODAL_CLOSE]: (state: ImportReduxState) => ({
    ...state,
    isCurlModalOpen: false,
  }),
  [ReduxActionTypes.SUBMIT_CURL_FORM_INIT]: (state: ImportReduxState) => {
    return {
      ...state,
      isImportingCurl: true,
    };
  },
  [ReduxActionTypes.SUBMIT_CURL_FORM_SUCCESS]: (state: ImportReduxState) => ({
    ...state,
    isImportingCurl: false,
    isCurlModalOpen: false,
  }),
  [ReduxActionErrorTypes.SUBMIT_CURL_FORM_ERROR]: (
    state: ImportReduxState,
    action: ReduxAction<{ errorPayload: string }>,
  ) => {
    return { ...state, errorPayload: action.payload, isImportingCurl: false };
  },
});

import type { ImportReduxState } from "./importReducer.types";

export default importReducer;
