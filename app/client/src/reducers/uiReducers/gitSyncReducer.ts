import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";
import { RepoDetails } from "entities/GitSync";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: true,
};

const tourReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isGitSyncModalOpen: action.payload,
  }),
  [ReduxActionTypes.FETCH_GIT_REPO_DETAILS_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<RepoDetails>,
  ) => ({
    ...state,
    repoURL: action.payload?.url,
    isConnectionSuccessful: action.payload?.isConnectionSuccessful,
  }),
  // [ReduxActionTypes.FETCH_GIT_STATUS_SUCCESS]: (
  //   state: GitSyncReducerState,
  //   action: ReduxAction<RepoDetails>,
  // ) => ({
  //   ...state,
  // }),
});

export type GitSyncReducerState = {
  isGitSyncModalOpen: boolean;
  repoURL?: string;
  isConnectionSuccessful?: boolean;
};

export default tourReducer;
