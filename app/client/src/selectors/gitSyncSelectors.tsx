import type { DefaultRootState } from "react-redux";
import { createSelector } from "reselect";
import {
  getCurrentAppGitMetaData,
  getCurrentApplication,
} from "ee/selectors/applicationSelectors";
import type { Branch } from "entities/GitSync";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";

export const getGitSyncState = (state: DefaultRootState) => state.ui.gitSync;

export const getIsGitSyncModalOpen = (state: DefaultRootState) =>
  state.ui.gitSync.isGitSyncModalOpen;

export const getIsDeploying = (state: DefaultRootState) =>
  state.ui.gitSync.isDeploying;

export const getIsDisconnectGitModalOpen = (state: DefaultRootState) =>
  state.ui.gitSync.isDisconnectGitModalOpen;

export const getIsGitRepoSetup = (state: DefaultRootState) => {
  const gitMetadata = getCurrentAppGitMetaData(state);

  return gitMetadata?.remoteUrl;
};

export const getIsCommittingInProgress = (state: DefaultRootState) =>
  state.ui.gitSync.isCommitting;

export const getIsDiscardInProgress = (state: DefaultRootState) =>
  state.ui.gitSync.isDiscarding;

export const getIsCommitSuccessful = (state: DefaultRootState) =>
  state.ui.gitSync.isCommitSuccessful;

export const getActiveGitSyncModalTab = (state: DefaultRootState) =>
  state.ui.gitSync.activeGitSyncModalTab;

export const getIsGitErrorPopupVisible = (state: DefaultRootState) =>
  state.ui.gitSync.isErrorPopupVisible;

export const getGlobalGitConfig = (state: DefaultRootState) =>
  state.ui.gitSync.globalGitConfig;

export const getLocalGitConfig = (state: DefaultRootState) =>
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

export const getIsFetchingGlobalGitConfig = (state: DefaultRootState) =>
  state.ui.gitSync.isFetchingGlobalGitConfig;

export const getIsFetchingLocalGitConfig = (state: DefaultRootState) =>
  state.ui.gitSync.isFetchingLocalGitConfig;

export const getGitStatus = (state: DefaultRootState) =>
  state.ui.gitSync.gitStatus;

export const getGitConnectError = (state: DefaultRootState) =>
  state.ui.gitSync.connectError?.error;

export const getGitPullError = (state: DefaultRootState) =>
  state.ui.gitSync.pullError?.error;

export const getGitMergeError = (state: DefaultRootState) =>
  state.ui.gitSync.mergeError?.error;

export const getGitCommitAndPushError = (state: DefaultRootState) =>
  state.ui.gitSync.commitAndPushError?.error;

export const getGitDiscardError = (state: DefaultRootState) =>
  state.ui.gitSync.discardError?.error;

export const getIsFetchingGitStatus = (state: DefaultRootState) =>
  state.ui.gitSync.isFetchingGitStatus;

export const getIsPullingProgress = (state: DefaultRootState) =>
  state.ui.gitSync.pullInProgress;

export const getIsFetchingMergeStatus = (state: DefaultRootState) =>
  state.ui.gitSync.isFetchingMergeStatus;

export const getMergeStatus = (state: DefaultRootState) =>
  state.ui.gitSync.mergeStatus;

export const getIsGitConnected = createSelector(
  getCurrentAppGitMetaData,
  (gitMetaData) => !!(gitMetaData && gitMetaData.remoteUrl),
);

/**
 * getGitBranches: returns list of git branches in redux store
 * @param state {DefaultRootState}
 * @return Branch[]
 */
export const getGitBranches = (state: DefaultRootState): Branch[] =>
  state.ui.gitSync.branches;

export const getGitBranchNames = createSelector(getGitBranches, (branches) =>
  branches.map((branchObj) => branchObj.branchName),
);

export const getDefaultGitBranchName = createSelector(
  getGitBranches,
  (branches: Array<Branch>) =>
    branches.find((branchObj) => branchObj.default)?.branchName,
);

export const getFetchingBranches = (state: DefaultRootState) =>
  state.ui.gitSync.fetchingBranches;

export const getCurrentGitBranch = (
  state: DefaultRootState,
): string | undefined => {
  const { gitApplicationMetadata } = getCurrentApplication(state) || {};

  return gitApplicationMetadata?.branchName;
};

export const showBranchPopupSelector = (state: DefaultRootState) =>
  state.ui.gitSync.showBranchPopup;

export const getPullFailed = (state: DefaultRootState) =>
  state.ui.gitSync.pullFailed;

export const getPullInProgress = (state: DefaultRootState) =>
  state.ui.gitSync.pullInProgress;

export const getIsMergeInProgress = (state: DefaultRootState) =>
  state.ui.gitSync.isMerging;
export const getTempRemoteUrl = (state: DefaultRootState) =>
  state.ui.gitSync.tempRemoteUrl;

export const getMergeError = (state: DefaultRootState) =>
  state.ui.gitSync.mergeError;

export const getCountOfChangesToCommit = (state: DefaultRootState) => {
  const gitStatus = getGitStatus(state);
  const {
    modified = [],
    modifiedDatasources = 0,
    modifiedJSLibs = 0,
    modifiedJSObjects = 0,
    modifiedModuleInstances = 0,
    modifiedPages = 0,
    modifiedQueries = 0,
    modifiedSourceModules = 0,
  } = gitStatus || {};
  const themeCount = modified.includes("theme.json") ? 1 : 0;
  const settingsCount = modified.includes("application.json") ? 1 : 0;

  // does not include ahead and behind remote counts
  return (
    modifiedDatasources +
    modifiedJSLibs +
    modifiedJSObjects +
    modifiedSourceModules +
    modifiedModuleInstances +
    modifiedPages +
    modifiedQueries +
    themeCount +
    settingsCount
  );
};

export const getShowRepoLimitErrorModal = (state: DefaultRootState) =>
  state.ui.gitSync.showRepoLimitErrorModal;

export const getDisconnectingGitApplication = (state: DefaultRootState) =>
  state.ui.gitSync.disconnectingGitApp;

export const getUseGlobalProfile = (state: DefaultRootState) =>
  state.ui.gitSync.useGlobalProfile;

const FALLBACK_GIT_SYNC_DOCS_URL =
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git";

export const getDiscardDocUrl = (state: DefaultRootState) =>
  state.ui.gitSync.gitStatus?.discardDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git connect ssh key deploy url
export const getSSHKeyDeployDocUrl = (state: DefaultRootState) =>
  state.ui.gitSync.deployKeyDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git connect remote url
export const getRemoteUrlDocUrl = (state: DefaultRootState) =>
  state.ui.gitSync.deployKeyDocUrl || FALLBACK_GIT_SYNC_DOCS_URL;

// git deploy conflict doc url
export const getConflictFoundDocUrlDeploy = (state: DefaultRootState) =>
  state.ui.gitSync.pullError?.error?.referenceDoc || FALLBACK_GIT_SYNC_DOCS_URL;

// git deploy conflict doc url
export const getConflictFoundDocUrlMerge = (state: DefaultRootState) =>
  state.ui.gitSync.mergeStatus?.referenceDoc ||
  state.ui.gitSync.mergeError?.error?.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

// git disconnect learn more doc url
export const getDisconnectDocUrl = () =>
  "https://docs.appsmith.com/advanced-concepts/version-control-with-git/disconnect-the-git-repository";

export const getConnectingErrorDocUrl = (state: DefaultRootState) =>
  state.ui.gitSync.connectError?.error?.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

export const getUpstreamErrorDocUrl = (state: DefaultRootState) =>
  state.ui.gitSync.commitAndPushError?.error?.referenceDoc ||
  FALLBACK_GIT_SYNC_DOCS_URL;

export const getSshKeyPair = (state: DefaultRootState) =>
  state.ui.gitSync.SSHKeyPair;
export const getSupportedKeyTypes = (state: DefaultRootState) =>
  state.ui.gitSync.supportedKeyTypes;

export const getIsImportingApplicationViaGit = (state: DefaultRootState) =>
  state.ui.gitSync.isImportingApplicationViaGit;

export const getDeleteBranchWarning = (state: DefaultRootState) =>
  state.ui.gitSync.deleteBranchWarning;

export const getBranchSwitchingDetails = (state: DefaultRootState) => ({
  isSwitchingBranch: state.ui.gitSync.isSwitchingBranch,
  switchingToBranch: state.ui.gitSync.switchingToBranch,
});

export const getProtectedBranchesSelector = (state: DefaultRootState) =>
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

export const getIsUpdateProtectedBranchesLoading = (
  state: DefaultRootState,
) => {
  return (
    state.ui.gitSync.isUpdateProtectedBranchesLoading ||
    state.ui.gitSync.protectedBranchesLoading
  );
};

export const getIsGetProtectedBranchesLoading = (state: DefaultRootState) => {
  return state.ui.gitSync.protectedBranchesLoading;
};

export const getIsAutocommitToggling = (state: DefaultRootState) =>
  state.ui.gitSync.togglingAutocommit;

export const getIsAutocommitModalOpen = (state: DefaultRootState) =>
  state.ui.gitSync.isAutocommitModalOpen;

export const getIsTriggeringAutocommit = (state: DefaultRootState) =>
  state.ui.gitSync.triggeringAutocommit;

export const getIsPollingAutocommit = (state: DefaultRootState) =>
  state.ui.gitSync.pollingAutocommitStatus;

export const getGitMetadataSelector = (state: DefaultRootState) =>
  state.ui.gitSync.gitMetadata;

export const getGitMetadataLoadingSelector = (state: DefaultRootState) =>
  state.ui.gitSync.gitMetadataLoading;

export const getAutocommitEnabledSelector = (state: DefaultRootState) =>
  !!state.ui.gitSync.gitMetadata?.autoCommitConfig?.enabled;

export const isGitSettingsModalOpenSelector = (state: DefaultRootState) =>
  state.ui.gitSync.isGitSettingsModalOpen;

export const activeGitSettingsModalTabSelector = (state: DefaultRootState) =>
  state.ui.gitSync.activeGitSettingsModalTab;

export const isGitPersistBranchEnabledSelector = createSelector(
  selectFeatureFlags,
  (featureFlags) => featureFlags.release_git_persist_branch_enabled ?? false,
);
