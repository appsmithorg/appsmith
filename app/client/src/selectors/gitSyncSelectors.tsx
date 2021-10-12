import { AppState } from "reducers";
import { createSelector } from "reselect";
import { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import { getCurrentAppGitMetaData } from "./applicationSelectors";

export const getGitSyncState = (state: AppState): GitSyncReducerState =>
  state.ui.gitSync;

export const getIsGitSyncModalOpen = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isGitSyncModalOpen,
);

export const getIsGitRepoSetup = () => true;

export const getIsCommittingInProgress = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isCommitting,
);

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

export const getActiveGitSyncModalTab = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.activeGitSyncModalTab,
);

export const getIsGitErrorPopupVisible = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isErrorPopupVisible,
);

export const getGitPushError = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.gitPushError,
);

export const getIsImportAppViaGitModalOpen = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isImportAppViaGitModalOpen,
);

export const getOrganizationIdForImport = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.organizationIdForImport,
);

export const getGlobalGitConfig = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.globalGitConfig,
);

export const getLocalGitConfig = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.localGitConfig,
);

export const getIsFetchingGlobalGitConfig = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isFetchingGitConfig,
);

export const getIsFetchingLocalGitConfig = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isFetchingLocalGitConfig,
);

export const getGitStatus = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.gitStatus,
);

export const getIsDisconnectingGit = createSelector(
  getGitSyncState,
  (gitSync) => gitSync.isDisconnectingGit,
);

export const getIsGitConnected = createSelector(
  getCurrentAppGitMetaData,
  (gitMetaData) => !!(gitMetaData && gitMetaData.remoteUrl),
);
