import { AppState } from "reducers";

export const getIsGitSyncModalOpen = (state: AppState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsGitRepoSetup = () => true;

export const getIsCommittingInProgress = (state: AppState) =>
  state.ui.gitSync.isCommitting;

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

export const getIsFetchingGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingGitConfig;

export const getGitBranches = (state: AppState) => state.ui.gitSync.branches;
export const getFetchingBranches = (state: AppState) =>
  state.ui.gitSync.fetchingBranches;
