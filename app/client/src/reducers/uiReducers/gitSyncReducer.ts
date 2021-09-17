import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { GitSyncModalTab, GitConfig } from "entities/GitSync";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
  isCommitting: false,
  activeGitSyncModalTab: GitSyncModalTab.GIT_CONNECTION,
  isErrorPopupVisible: false,
  globalGitConfig: { authorEmail: "", authorName: "" },
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{
      isOpen: boolean;
      tab: GitSyncModalTab;
    }>,
  ) => {
    const activeGitSyncModalTab =
      action.payload.tab || state.activeGitSyncModalTab;
    return {
      ...state,
      isGitSyncModalOpen: action.payload.isOpen,
      activeGitSyncModalTab,
    };
  },
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
  [ReduxActionTypes.SHOW_ERROR_POPUP]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isVisible: boolean }>,
  ) => ({
    ...state,
    isErrorPopupVisible: action.payload.isVisible,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: true,
  }),
  [ReduxActionTypes.UPDATE_GIT_CONFIG_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isFetchingGitConfig: true,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGitConfig: false,
  }),
  [ReduxActionTypes.UPDATE_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGitConfig: false,
  }),
  [ReduxActionErrorTypes.UPDATE_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: false,
  }),
  [ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: false,
  }),
});

export type GitSyncReducerState = {
  isGitSyncModalOpen?: boolean;
  isCommitting?: boolean;
  activeGitSyncModalTab: GitSyncModalTab;
  isErrorPopupVisible?: boolean;
  gitError?: string;
  globalGitConfig: GitConfig;
  isFetchingGitConfig?: boolean;
};

export default gitSyncReducer;
