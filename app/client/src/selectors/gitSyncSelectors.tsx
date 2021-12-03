import { AppState } from "reducers";
import { createSelector } from "reselect";
import { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "./applicationSelectors";
import { Branch } from "entities/GitSync";

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

export const getIsImportAppViaGitModalOpen = (state: AppState) =>
  state.ui.gitSync.isImportAppViaGitModalOpen;

export const getOrganizationIdForImport = (state: AppState) =>
  state.ui.gitSync.organizationIdForImport;

export const getGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.globalGitConfig;

export const getLocalGitConfig = (state: AppState) =>
  state.ui.gitSync.localGitConfig;

export const getIsLocalConfigDefined = createSelector(
  getLocalGitConfig,
  (localGitConfig) =>
    !!(localGitConfig.authorEmail || localGitConfig.authorName),
);

export const getIsGlobalConfigDefined = createSelector(
  getGlobalGitConfig,
  (globalGitConfig) =>
    !!(globalGitConfig.authorEmail || globalGitConfig.authorName),
);

export const getIsFetchingGlobalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingGitConfig;

export const getIsFetchingLocalGitConfig = (state: AppState) =>
  state.ui.gitSync.isFetchingLocalGitConfig;

export const getGitStatus = (state: AppState) => state.ui.gitSync.gitStatus;

export const getGitConnectError = (state: AppState) =>
  state.ui.gitSync.connectError?.error;

export const getGitPullError = (state: AppState) =>
  state.ui.gitSync.pullError?.error;

export const getGitMergeError = (state: AppState) =>
  state.ui.gitSync.mergeError?.error;

export const getGitCommitAndPushError = (state: AppState) =>
  state.ui.gitSync.commitAndPushError?.error;

export const getIsFetchingGitStatus = (state: AppState) =>
  state.ui.gitSync.isFetchingGitStatus;

export const getIsPullingProgress = (state: AppState) =>
  state.ui.gitSync.pullInProgress;

export const getIsFetchingMergeStatus = (state: AppState) =>
  state.ui.gitSync.isFetchingMergeStatus;

export const getMergeStatus = (state: AppState) => state.ui.gitSync.mergeStatus;

export const getIsGitConnected = createSelector(
  getCurrentAppGitMetaData,
  (gitMetaData) => !!(gitMetaData && gitMetaData.remoteUrl),
);
export const getGitBranches = (state: AppState) => state.ui.gitSync.branches;

export const getGitBranchNames = createSelector(getGitBranches, (branches) =>
  branches.map((branchObj) => branchObj.branchName),
);

export const getDefaultGitBranchName = createSelector(
  getGitBranches,
  (branches: Array<Branch>) =>
    branches.find((branchObj) => branchObj.default)?.branchName,
);

export const getFetchingBranches = (state: AppState) =>
  state.ui.gitSync.fetchingBranches;

export const getCurrentGitBranch = (state: AppState) => {
  const { gitApplicationMetadata } = getCurrentApplication(state) || {};
  return gitApplicationMetadata?.branchName;
};

export const getPullFailed = (state: AppState) => state.ui.gitSync.pullFailed;

export const getPullInProgress = (state: AppState) =>
  state.ui.gitSync.pullInProgress;

export const getIsMergeInProgress = (state: AppState) =>
  state.ui.gitSync.isMerging;
export const getTempRemoteUrl = (state: AppState) =>
  state.ui.gitSync.tempRemoteUrl;

export const getCountOfChangesToCommit = (state: AppState) => {
  const gitStatus = getGitStatus(state);
  const { modifiedPages = 0, modifiedQueries = 0 } = gitStatus || {};
  return modifiedPages + modifiedQueries;
};
