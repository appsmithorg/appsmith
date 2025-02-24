import type { PageDefaultMeta } from "ee/api/ApplicationApi";
import type { GitConfig, GitSyncModalTab, MergeStatus } from "entities/GitSync";

export enum GitSettingsTab {
  GENERAL = "GENERAL",
  BRANCH = "BRANCH",
  CD = "CD",
}

export interface GitBranchDeleteState {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteBranch?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteBranchError?: any;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  deleteBranchWarning?: any;
  deletingBranch?: boolean;
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

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export interface GitStatusData {
  modified: string[];
  added: string[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removed: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagesModified: any[];
  pagesAdded: string[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pagesRemoved: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queriesModified: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queriesAdded: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queriesRemoved: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsObjectsModified: any[];
  jsObjectsAdded: string[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsObjectsRemoved: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasourcesModified: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasourcesAdded: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  datasourcesRemoved: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsLibsModified: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsLibsAdded: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsLibsRemoved: any[];
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  modifiedSourceModules?: number;
  modifiedModuleInstances?: number;
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

export interface SSHKeyType {
  keySize: number;
  platFormSupported: string;
  protocolName: string;
}

export interface GetSSHKeyResponseData {
  gitSupportedSSHKeyType: SSHKeyType[];
  docUrl: string;
  publicKey?: string;
}
