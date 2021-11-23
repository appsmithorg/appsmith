import { createReducer } from "utils/AppsmithUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";
import { GitSyncModalTab, GitConfig, MergeStatus } from "entities/GitSync";

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
  isCommitting: false,
  isPushingToGit: false,
  isCommitSuccessful: false,
  isPushSuccessful: false,
  activeGitSyncModalTab: GitSyncModalTab.GIT_CONNECTION,
  isErrorPopupVisible: false,
  isImportAppViaGitModalOpen: false,
  isFetchingGitStatus: false,
  isFetchingMergeStatus: false,
  globalGitConfig: { authorEmail: "", authorName: "" },
  branches: [],
  fetchingBranches: false,
  localGitConfig: { authorEmail: "", authorName: "" },

  isFetchingLocalGitConfig: false,
  isFetchingGitConfig: false,
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{
      isOpen: boolean;
      tab: GitSyncModalTab;
    }>,
  ) => {
    const activeGitSyncModalTab = action.payload.tab;

    return {
      ...state,
      isGitSyncModalOpen: action.payload.isOpen,
      activeGitSyncModalTab,
      gitError: null,
      // reset conflicts when the modal is opened
      pullFailed: false,
    };
  },
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isCommitting: true,
    isCommitSuccessful: false,
  }),
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
    isCommitSuccessful: true,
    gitError: null,
  }),
  [ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
  }),
  [ReduxActionTypes.CLEAR_COMMIT_SUCCESSFUL_STATE]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitSuccessful: false,
  }),
  [ReduxActionTypes.PUSH_TO_GIT_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isPushingToGit: true,
    isPushSuccessful: false,
    gitError: null,
  }),
  [ReduxActionTypes.PUSH_TO_GIT_SUCCESS]: (state: GitSyncReducerState) => ({
    ...state,
    isPushingToGit: false,
    isPushSuccessful: true,
  }),
  [ReduxActionErrorTypes.PUSH_TO_GIT_ERROR]: (state: GitSyncReducerState) => ({
    ...state,
    isPushingToGit: false,
  }),
  [ReduxActionTypes.SHOW_ERROR_POPUP]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isVisible: boolean }>,
  ) => ({
    ...state,
    isErrorPopupVisible: action.payload.isVisible,
  }),
  [ReduxActionTypes.SET_IS_IMPORT_APP_VIA_GIT_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isOpen: boolean; organizationId: string }>,
  ) => ({
    ...state,
    isImportAppViaGitModalOpen: action.payload.isOpen,
    organisationIdForImport: action.payload.organizationId,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: true,
    gitError: null,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: true,
    gitError: null,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGitConfig: false,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_SUCCESS]: (
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
  [ReduxActionTypes.FETCH_BRANCHES_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    fetchingBranches: true,
    gitError: null,
  }),
  [ReduxActionTypes.FETCH_BRANCHES_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<any[]>,
  ) => ({
    ...state,
    branches: action.payload,
    fetchingBranches: false,
  }),
  [ReduxActionErrorTypes.FETCH_BRANCHES_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    fetchingBranches: false,
  }),
  [ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: true,
    gitError: null,
  }),
  [ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: true,
    gitError: null,
  }),
  [ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    localGitConfig: action.payload,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    localGitConfig: action.payload,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionErrorTypes.UPDATE_LOCAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionErrorTypes.FETCH_LOCAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionTypes.FETCH_GIT_STATUS_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isFetchingGitStatus: true,
    gitError: null,
  }),
  [ReduxActionTypes.FETCH_GIT_STATUS_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitStatusData | undefined>,
  ) => ({
    ...state,
    gitStatus: action.payload,
    isFetchingGitStatus: false,
  }),
  [ReduxActionErrorTypes.FETCH_GIT_STATUS_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitStatus: false,
  }),
  [ReduxActionErrorTypes.DISCONNECT_TO_GIT_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isDisconnectingGit: false,
  }),
  [ReduxActionErrorTypes.GIT_SYNC_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    gitError: action.payload,
  }),
  [ReduxActionTypes.FETCH_MERGE_STATUS_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isFetchingMergeStatus: true,
    gitError: null,
  }),
  [ReduxActionTypes.FETCH_MERGE_STATUS_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    mergeStatus: action.payload,
    isFetchingMergeStatus: false,
  }),
  [ReduxActionErrorTypes.FETCH_MERGE_STATUS_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingMergeStatus: false,
  }),
  [ReduxActionTypes.RESET_MERGE_STATUS]: (state: GitSyncReducerState) => ({
    ...state,
    mergeStatus: null,
  }),
  [ReduxActionTypes.GIT_PULL_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<MergeStatus>,
  ) => ({
    ...state,
    pullFailed: false,
    pullMergeStatus: action.payload,
    pullInProgress: false,
  }),
  [ReduxActionTypes.GIT_PULL_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    pullMergeStatus: null,
    pullInProgress: true,
  }),
  [ReduxActionErrorTypes.GIT_PULL_ERROR]: (state: GitSyncReducerState) => ({
    ...state,
    pullInProgress: false,
    pullFailed: true,
  }),
  [ReduxActionTypes.RESET_PULL_MERGE_STATUS]: (state: GitSyncReducerState) => ({
    ...state,
    pullFailed: false,
  }),
});

export type GitStatusData = {
  aheadCount: number;
  behindCount: number;
  conflicting: Array<string>;
  isClean: boolean;
  modified: Array<string>;
  modifiedPages: number;
  modifiedQueries: number;
  remoteBranch: string;
};

export type GitErrorType = {
  code: number;
  errorType?: string;
  message: string;
};

export type GitSyncReducerState = {
  isGitSyncModalOpen: boolean;
  isCommitting?: boolean;
  isCommitSuccessful: boolean;
  isPushSuccessful: boolean;
  isPushingToGit?: boolean;

  fetchingBranches: boolean;
  isFetchingGitConfig: boolean;
  isFetchingLocalGitConfig: boolean;

  isFetchingGitStatus: boolean;
  isFetchingMergeStatus: boolean;

  activeGitSyncModalTab: GitSyncModalTab;
  isImportAppViaGitModalOpen: boolean;
  organizationIdForImport?: string;
  isErrorPopupVisible?: boolean;
  globalGitConfig: GitConfig;

  branches: Array<{ branchName: string; default: boolean }>;

  localGitConfig: GitConfig;
  gitStatus?: GitStatusData;
  mergeStatus?: MergeStatus;
  gitError?: GitErrorType;
  pullFailed?: boolean;
  pullInProgress?: boolean;
};

export default gitSyncReducer;
