import { AppState } from "reducers";
import { createSelector } from "reselect";
import { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "./applicationSelectors";

export const getGitSyncState = (state: AppState): GitSyncReducerState =>
  state.ui.gitSync;

export const getIsGitSyncModalOpen = (state: AppState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsGitRepoSetup = (state: AppState) => {
  const gitMetadata = getCurrentAppGitMetaData(state);
  return gitMetadata?.remoteUrl;
};

export const getIsCommittingInProgress = (state: AppState) =>
  state.ui.gitSync.isCommitting;

export const getIsPushingToGit = (state: AppState) =>
  state.ui.gitSync.isPushingToGit;

export const getIsCommitSuccessful = (state: AppState) =>
  state.ui.gitSync.isCommitSuccessful;

export const getIsPushSuccessful = (state: AppState) =>
  state.ui.gitSync.isPushSuccessful;

export const getActiveGitSyncModalTab = (state: AppState) =>
  state.ui.gitSync.activeGitSyncModalTab;

export const getIsGitErrorPopupVisible = (state: AppState) =>
  state.ui.gitSync.isErrorPopupVisible;

export const getGitPushError = (state: AppState) =>
  state.ui.gitSync.gitPushError;

export const getIsImportAppViaGitModalOpen = (state: AppState) =>
  state.ui.gitSync.isImportAppViaGitModalOpen;

export const getOrganizationIdForImport = (state: AppState) =>
  state.ui.gitSync.organizationIdForImport;

export const getGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.globalGitConfig;

export const getLocalGitConfig = (state: AppState) =>
  state.ui.gitSync.localGitConfig;

export const getIsFetchingGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingGitConfig;

export const getIsFetchingLocalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingLocalGitConfig;

export const getGitStatus = (state: AppState) => state.ui.gitSync.gitStatus;

export const getIsFetchingGitStatus = (state: AppState) =>
  state.ui.gitSync.isFetchingGitStatus;

export const getIsDisconnectingGit = (state: AppState) =>
  state.ui.gitSync.isDisconnectingGit;

export const getIsGitConnected = createSelector(
  getCurrentAppGitMetaData,
  (gitMetaData) => !!(gitMetaData && gitMetaData.remoteUrl),
);
export const getGitBranches = (state: AppState) => state.ui.gitSync.branches;

export const getFetchingBranches = (state: AppState) =>
  state.ui.gitSync.fetchingBranches;

export const getCurrentGitBranch = (state: AppState) => {
  const { gitApplicationMetadata } = getCurrentApplication(state) || {};
  return gitApplicationMetadata?.branchName;
};
