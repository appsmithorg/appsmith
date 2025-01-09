import type { GitConfig, MergeStatus } from "entities/GitSync";
import { GitSyncModalTab } from "entities/GitSync";
import type { GetSSHKeyResponseData, SSHKeyType } from "actions/gitSyncActions";
import type { PageDefaultMeta } from "ee/api/ApplicationApi";

export enum GitSettingsTab {
  GENERAL = "GENERAL",
  BRANCH = "BRANCH",
  CD = "CD",
}

export interface GitStatusData {
  modified: string[];
  added: string[];
  removed: any[];
  pagesModified: any[];
  pagesAdded: string[];
  pagesRemoved: any[];
  queriesModified: any[];
  queriesAdded: any[];
  queriesRemoved: any[];
  jsObjectsModified: any[];
  jsObjectsAdded: string[];
  jsObjectsRemoved: any[];
  datasourcesModified: any[];
  datasourcesAdded: any[];
  datasourcesRemoved: any[];
  jsLibsModified: any[];
  jsLibsAdded: any[];
  jsLibsRemoved: any[];
  conflicting: any[];
  isClean: boolean;
  aheadCount: number;
  behindCount: number;
  remoteBranch: string;
  discardDocUrl: string;
  migrationMessage: string;
  modifiedPages: number;
  modifiedDatasources: number;
  modifiedJSObjects: number;
  modifiedQueries: number;
  modifiedJSLibs: number;
  modifiedPackages?: number;
  modifiedModules?: number;
  modifiedModuleInstances?: number;
}

interface GitErrorPayloadType {
  code: number | string;
  errorType?: string;
  message: string;
  referenceDoc?: string;
}

export interface GitErrorType {
  error: GitErrorPayloadType;
  show?: boolean;
  crash?: boolean;
  logToSentry?: boolean;
}

export interface GitBranchDeleteState {
  deleteBranch?: any;
  deleteBranchError?: any;
  deleteBranchWarning?: any;
  deletingBranch?: boolean;
}

export interface GitDiscardResponse {
  id: string;
  modifiedBy: string;
  userPermissions: string[];
  name: string;
  workspaceId: string;
  isPublic: boolean;
  pages: PageDefaultMeta[];
  appIsExample: boolean;
  color: string;
  icon: string;
  slug: string;
  gitApplicationMetadata: {
    branchName: string;
    defaultBranchName: string;
    remoteUrl: string;
    browserSupportedRemoteUrl: string;
    isRepoPrivate: boolean;
    repoName: string;
    defaultApplicationId: string;
    lastCommittedAt: string;
  };
  lastDeployedAt: string;
  evaluationVersion: number;
  applicationVersion: number;
  isManualUpdate: boolean;
  isAutoUpdate: boolean;
  appLayout: {
    type: string;
  };
  new: boolean;
  modifiedAt: string;
}

export type GitMetadata = {
  branchName: string;
  defaultBranchName: string;
  remoteUrl: string;
  repoName: string;
  browserSupportedUrl?: string;
  isRepoPrivate?: boolean;
  browserSupportedRemoteUrl: string;
  defaultApplicationId: string;
  isProtectedBranch: boolean;
  autoCommitConfig: {
    enabled: boolean;
  };
  isAutoDeploymentEnabled?: boolean;
} | null;

export type GitSyncReducerState = GitBranchDeleteState & {
  isGitSyncModalOpen: boolean;
  isCommitting?: boolean;
  isCommitSuccessful: boolean;

  fetchingBranches: boolean;
  isFetchingGlobalGitConfig: boolean;
  isFetchingLocalGitConfig: boolean;

  isFetchingGitStatus: boolean;
  isFetchingMergeStatus: boolean;

  activeGitSyncModalTab: GitSyncModalTab;
  isErrorPopupVisible?: boolean;
  globalGitConfig: GitConfig;

  branches: Array<{ branchName: string; default: boolean }>;
  showBranchPopup: boolean;

  localGitConfig: GitConfig;
  gitStatus?: GitStatusData;
  mergeStatus?: MergeStatus;
  connectError?: GitErrorType;
  commitAndPushError?: GitErrorType;
  pullError?: GitErrorType;
  mergeError?: GitErrorType;
  pullFailed?: boolean;
  pullInProgress?: boolean;

  isMerging?: boolean;
  tempRemoteUrl?: string;

  showRepoLimitErrorModal: boolean;
  isDisconnectGitModalOpen: boolean;
  disconnectingGitApp: {
    id: string;
    name: string;
  };
  useGlobalProfile?: boolean;

  SSHKeyPair?: string;
  deployKeyDocUrl?: string;
  supportedKeyTypes?: SSHKeyType[];

  isImportingApplicationViaGit?: boolean;
  gitImportError?: any;

  isDiscarding: boolean;
  discard?: GitDiscardResponse;
  discardError?: GitErrorType;

  isSwitchingBranch: boolean;
  switchingToBranch: string | null;
  isDeploying: boolean;

  protectedBranches: string[];
  protectedBranchesLoading: boolean;
  isUpdateProtectedBranchesLoading: boolean;

  isAutocommitModalOpen: boolean;
  togglingAutocommit: boolean;
  triggeringAutocommit: boolean;
  pollingAutocommitStatus: boolean;

  gitMetadata: GitMetadata | null;
  gitMetadataLoading: boolean;

  isGitSettingsModalOpen: boolean;
  activeGitSettingsModalTab: GitSettingsTab;
};

// Re-export imported types for backward compatibility
export type { GitConfig, MergeStatus, GetSSHKeyResponseData, SSHKeyType, PageDefaultMeta };
export { GitSyncModalTab };
