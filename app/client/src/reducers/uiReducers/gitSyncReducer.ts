import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
  isCommitting: false,
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isGitSyncModalOpen: action.payload,
  }),
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isCommitting: true,
  }),
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
  }),
  [ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
  }),
});

export type GitSyncReducerState = {
  isGitSyncModalOpen: boolean;
  isCommitting: boolean;
};

export default gitSyncReducer;
