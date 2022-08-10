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

export const getIsDisconnectGitModalOpen = (state: AppState) =>
  state.ui.gitSync.isDisconnectGitModalOpen;

export const getIsGitRepoSetup = (state: AppState) => {
  const gitMetadata = getCurrentAppGitMetaData(state);
  return gitMetadata?.remoteUrl;
};

export const getIsCommittingInProgress = (state: AppState) =>
  state.ui.gitSync.isCommitting;

export const getIsDiscardInProgress = (state: AppState) =>
  state.ui.gitSync.isDiscarding;

export const getIsCommitSuccessful = (state: AppState) =>
  state.ui.gitSync.isCommitSuccessful;

export const getActiveGitSyncModalTab = (state: AppState) =>
  state.ui.gitSync.activeGitSyncModalTab;

export const getIsGitErrorPopupVisible = (state: AppState) =>
  state.ui.gitSync.isErrorPopupVisible;

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

/**
 * getGitBranches: returns list of git branches in redux store
 * @param state {AppState}
 * @return Branch[]
 */
export const getGitBranches = (state: AppState): Branch[] =>
  state.ui.gitSync.branches;

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

export const getCurrentGitBranch = (state: AppState): string | undefined => {
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

export const getMergeError = (state: AppState) => state.ui.gitSync.mergeError;

export const getCountOfChangesToCommit = (state: AppState) => {
  const gitStatus = getGitStatus(state);
  const { modifiedPages = 0, modifiedQueries = 0 } = gitStatus || {};
  return modifiedPages + modifiedQueries;
};

export const getShowRepoLimitErrorModal = (state: AppState) =>
  state.ui.gitSync.showRepoLimitErrorModal;

export const getDisconnectingGitApplication = (state: AppState) =>
  state.ui.gitSync.disconnectingGitApp;

export const getUseGlobalProfile = (state: AppState) =>
  state.ui.gitSync.useGlobalProfile;

const FALLBACK_GIT_SYNC_DOCS_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git";

export const getDiscardDocUrl = (state: AppState) =>
  state.ui.gitSync.gitStatus?.discardDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git connect ssh key deploy url
export const getSSHKeyDeployDocUrl = (state: AppState) =>
  state.ui.gitSync.deployKeyDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git connect remote url
export const getRemoteUrlDocUrl = (state: AppState) =>
  state.ui.gitSync.deployKeyDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git deploy conflict doc url
export const getConflictFoundDocUrlDeploy = (state: AppState) =>
  state.ui.gitSync.pullError?.error?.referenceDoc || FALLBACK_GIT_SYNC_DOCS_URL;

// git deploy conflict doc url
export const getConflictFoundDocUrlMerge = (state: AppState) =>
  state.ui.gitSync.mergeStatus?.referenceDoc ||
  state.ui.gitSync.mergeError?.error?.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

// git disconnect learn more doc url
export const getDisconnectDocUrl = () =>
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/disconnect-the-git-repository";

export const getConnectingErrorDocUrl = (state: AppState) =>
  state.ui.gitSync.connectError?.error.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

export const getUpstreamErrorDocUrl = (state: AppState) =>
  state.ui.gitSync.commitAndPushError?.error?.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

export const getSshKeyPair = (state: AppState) => state.ui.gitSync.SSHKeyPair;
export const getSupportedKeyTypes = (state: AppState) =>
  state.ui.gitSync.supportedKeyTypes;

export const getIsImportingApplicationViaGit = (state: AppState) =>
  state.ui.gitSync.isImportingApplicationViaGit;

export const getDeleteBranchWarning = (state: AppState) =>
  state.ui.gitSync.deleteBranchWarning;
