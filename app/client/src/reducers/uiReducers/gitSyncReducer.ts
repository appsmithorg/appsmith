import { createReducer } from "utils/AppsmithUtils";
import { ReduxAction, ReduxActionTypes } from "constants/ReduxActionConstants";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isGitSyncModalOpen: action.payload,
  }),
});

export type GitSyncReducerState = {
  isGitSyncModalOpen: boolean;
};

export default gitSyncReducer;
