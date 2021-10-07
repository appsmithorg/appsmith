import { AppState } from "reducers";
import { createSelector } from "reselect";
import { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";

export const getGitSyncState = (state: AppState): GitSyncReducerState =>
  state.ui.gitSync;

export const getIsGitSyncModalOpen = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isGitSyncModalOpen,
);

export const getIsGitRepoSetup = () => true;

export const getIsCommittingInProgress = (state: AppState) =>
  state.ui.gitSync.isCommitting;

export const getIsPushingToGit = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isPushingToGit,
);

export const getIsCommitSuccessful = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isCommitSuccessful,
);

export const getIsPushSuccessful = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isPushSuccessful,
);

export const getActiveGitSyncModalTab = (state: AppState) =>
  state.ui.gitSync.activeGitSyncModalTab;

export const getIsGitErrorPopupVisible = (state: AppState) =>
  state.ui.gitSync.isErrorPopupVisible;

export const getGitError = (state: AppState) => state.ui.gitSync.gitError;

export const getIsImportAppViaGitModalOpen = (state: AppState) =>
  state.ui.gitSync.isImportAppViaGitModalOpen;

export const getOrganizationIdForImport = (state: AppState) =>
  state.ui.gitSync.organizationIdForImport;

export const getGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.globalGitConfig;

export const getLocalGitConfig = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.localGitConfig,
);

export const getIsFetchingGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingGitConfig;
