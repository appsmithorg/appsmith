import type { AppState } from "ee/reducers";
import { createSelector } from "reselect";
import type { GitSyncReducerState } from "reducers/uiReducers/gitSyncReducer";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import type { Branch } from "entities/GitSync";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";

export const getGitSyncState = (state: AppState): GitSyncReducerState =>
  state.ui.gitSync;

export const getIsGitSyncModalOpen = (state: AppState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsDeploying = (state: AppState) => state.ui.gitSync.isDeploying;

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
  state.ui.gitSync.isFetchingGlobalGitConfig;

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

export const getGitDiscardError = (state: AppState) =>
  state.ui.gitSync.discardError?.error;

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

export const showBranchPopupSelector = (state: AppState) =>
  state.ui.gitSync.showBranchPopup;

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
  const {
    modified = [],
    modifiedDatasources = 0,
    modifiedJSLibs = 0,
    modifiedJSObjects = 0,
    modifiedModules = 0,
    modifiedPackages = 0,
    modifiedPages = 0,
    modifiedQueries = 0,
  } = gitStatus || {};
  const themeCount = modified.includes("theme.json") ? 1 : 0;
  const settingsCount = modified.includes("application.json") ? 1 : 0;

  // does not include ahead and behind remote counts
  return (
    modifiedDatasources +
    modifiedJSLibs +
    modifiedJSObjects +
    modifiedModules +
    modifiedPackages +
    modifiedPages +
    modifiedQueries +
    themeCount +
    settingsCount
  );
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
  state.ui.gitSync.connectError?.error?.referenceDoc ||
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

export const getBranchSwitchingDetails = (state: AppState) => ({
  isSwitchingBranch: state.ui.gitSync.isSwitchingBranch,
  switchingToBranch: state.ui.gitSync.switchingToBranch,
});

export const getProtectedBranchesSelector = (state: AppState) =>
  state.ui.gitSync.protectedBranches;

export const protectedModeSelector = createSelector(
  getIsGitConnected,
  getCurrentGitBranch,
  getProtectedBranchesSelector,
  (isGitConnected, currentBranch, protectedBranches = []) => {
    if (!isGitConnected || !currentBranch) {
      return false;
    } else {
      return protectedBranches.includes(currentBranch);
    }
  },
);

export const getIsUpdateProtectedBranchesLoading = (state: AppState) => {
  return (
    state.ui.gitSync.isUpdateProtectedBranchesLoading ||
    state.ui.gitSync.protectedBranchesLoading
  );
};

export const getIsGetProtectedBranchesLoading = (state: AppState) => {
  return state.ui.gitSync.protectedBranchesLoading;
};

export const getIsAutocommitToggling = (state: AppState) =>
  state.ui.gitSync.togglingAutocommit;

export const getIsAutocommitModalOpen = (state: AppState) =>
  state.ui.gitSync.isAutocommitModalOpen;

export const getIsTriggeringAutocommit = (state: AppState) =>
  state.ui.gitSync.triggeringAutocommit;

export const getIsPollingAutocommit = (state: AppState) =>
  state.ui.gitSync.pollingAutocommitStatus;

export const getGitMetadataSelector = (state: AppState) =>
  state.ui.gitSync.gitMetadata;

export const getGitMetadataLoadingSelector = (state: AppState) =>
  state.ui.gitSync.gitMetadataLoading;

export const getAutocommitEnabledSelector = (state: AppState) =>
  !!state.ui.gitSync.gitMetadata?.autoCommitConfig?.enabled;

export const isGitSettingsModalOpenSelector = (state: AppState) =>
  state.ui.gitSync.isGitSettingsModalOpen;

export const activeGitSettingsModalTabSelector = (state: AppState) =>
  state.ui.gitSync.activeGitSettingsModalTab;

export const isGitPersistBranchEnabledSelector = createSelector(
  selectFeatureFlags,
  (featureFlags) => featureFlags.release_git_persist_branch_enabled ?? false,
);

export const isGitModEnabledSelector = createSelector(
  selectFeatureFlags,
  // (featureFlags) => featureFlags.release_git_modularisation_enabled ?? false,
  () => true,
);
