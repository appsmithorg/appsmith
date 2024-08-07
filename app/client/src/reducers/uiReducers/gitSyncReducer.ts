import { createReducer } from "utils/ReducerUtils";
import type { ReduxAction } from "ee/constants/ReduxActionConstants";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type { GitConfig, MergeStatus } from "entities/GitSync";
import { GitSyncModalTab } from "entities/GitSync";
import type { GetSSHKeyResponseData, SSHKeyType } from "actions/gitSyncActions";
import type { PageDefaultMeta } from "ee/api/ApplicationApi";

export enum GitSettingsTab {
  GENERAL = "GENERAL",
  BRANCH = "BRANCH",
  CD = "CD",
}

const initialState: GitSyncReducerState = {
  isGitSyncModalOpen: false,
  isCommitting: false,
  isCommitSuccessful: false,
  activeGitSyncModalTab: GitSyncModalTab.GIT_CONNECTION,
  isErrorPopupVisible: false,
  isFetchingGitStatus: false,
  isFetchingMergeStatus: false,
  globalGitConfig: { authorEmail: "", authorName: "" },
  branches: [],
  fetchingBranches: false,
  localGitConfig: { authorEmail: "", authorName: "" },
  showBranchPopup: false,

  isDiscarding: false,

  isFetchingLocalGitConfig: false,
  isFetchingGlobalGitConfig: false,

  isMerging: false,
  tempRemoteUrl: "",

  showRepoLimitErrorModal: false,
  isDisconnectGitModalOpen: false,
  disconnectingGitApp: {
    id: "",
    name: "",
  },

  isSwitchingBranch: false,
  switchingToBranch: null,
  isDeploying: false,

  protectedBranchesLoading: false,
  protectedBranches: [],

  isUpdateProtectedBranchesLoading: false,

  isAutocommitModalOpen: false,
  togglingAutocommit: false,
  triggeringAutocommit: false,
  pollingAutocommitStatus: false,

  gitMetadata: null,
  gitMetadataLoading: false,

  isGitSettingsModalOpen: false,
  activeGitSettingsModalTab: GitSettingsTab.GENERAL,
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{
      isOpen: boolean;
      tab: GitSyncModalTab;
      isDeploying: boolean;
    }>,
  ) => {
    const activeGitSyncModalTab = action.payload.tab;
    const isDeploying = action.payload.isDeploying || false;

    return {
      ...state,
      isGitSyncModalOpen: action.payload.isOpen,
      activeGitSyncModalTab,
      connectError: null,
      commitAndPushError: null,
      discardError: null,
      pullError: null,
      mergeError: null,
      pullFailed: false, // reset conflicts when the modal is opened
      gitImportError: null,
      isDeploying,
    };
  },
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isCommitting: true,
    isCommitSuccessful: false,
  }),
  [ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitting: false,
    isCommitSuccessful: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    isCommitting: false,
    commitAndPushError: action.payload,
  }),
  [ReduxActionTypes.CLEAR_COMMIT_ERROR_STATE]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    commitAndPushError: null,
  }),
  [ReduxActionTypes.CLEAR_COMMIT_SUCCESSFUL_STATE]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isCommitSuccessful: false,
  }),
  [ReduxActionTypes.PUSH_TO_GIT_SUCCESS]: (state: GitSyncReducerState) => ({
    ...state,
    isPushingToGit: false,
    isPushSuccessful: true,
  }),
  [ReduxActionErrorTypes.PUSH_TO_GIT_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    isPushingToGit: false,
    commitAndPushError: action.payload,
  }),
  [ReduxActionTypes.SHOW_ERROR_POPUP]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ isVisible: boolean }>,
  ) => ({
    ...state,
    isErrorPopupVisible: action.payload.isVisible,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGlobalGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGlobalGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGlobalGitConfig: false,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGlobalGitConfig: false,
  }),
  [ReduxActionErrorTypes.UPDATE_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGlobalGitConfig: false,
  }),
  [ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGlobalGitConfig: false,
  }),
  [ReduxActionTypes.FETCH_BRANCHES_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    fetchingBranches: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.FETCH_BRANCHES_SUCCESS]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any[]>,
  ) => ({
    ...state,
    branches: action.payload,
    fetchingBranches: false,
  }),
  [ReduxActionErrorTypes.FETCH_BRANCHES_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    fetchingBranches: false,
  }),
  [ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    localGitConfig: action.payload,
    isFetchingLocalGitConfig: false,
    useGlobalProfile: action.payload?.useGlobalProfile,
  }),
  [ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    localGitConfig: action.payload,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionErrorTypes.UPDATE_LOCAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionErrorTypes.FETCH_LOCAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingLocalGitConfig: false,
  }),
  [ReduxActionTypes.FETCH_GIT_STATUS_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isFetchingGitStatus: true,
    connectError: null,
    pullError: null,
    mergeError: null,
  }),
  [ReduxActionTypes.FETCH_GIT_STATUS_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitStatusData | undefined>,
  ) => ({
    ...state,
    gitStatus: action.payload,
    isFetchingGitStatus: false,
  }),
  [ReduxActionErrorTypes.FETCH_GIT_STATUS_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitStatus: false,
  }),
  [ReduxActionErrorTypes.DISCONNECT_TO_GIT_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isDisconnectingGit: false,
  }),
  [ReduxActionErrorTypes.CONNECT_TO_GIT_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    connectError: action.payload,
    isImportingApplicationViaGit: false,
  }),
  [ReduxActionTypes.FETCH_MERGE_STATUS_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isFetchingMergeStatus: true,
    connectError: null,
    commitAndPushError: null,
    mergeStatus: null,
    pullError: null,
    mergeError: null,
    discardError: null,
  }),
  [ReduxActionTypes.FETCH_MERGE_STATUS_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    mergeStatus: action.payload,
    isFetchingMergeStatus: false,
  }),
  [ReduxActionErrorTypes.FETCH_MERGE_STATUS_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingMergeStatus: false,
  }),
  [ReduxActionTypes.RESET_MERGE_STATUS]: (state: GitSyncReducerState) => ({
    ...state,
    mergeStatus: null,
  }),
  [ReduxActionTypes.GIT_PULL_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<MergeStatus>,
  ) => ({
    ...state,
    pullFailed: false,
    pullMergeStatus: action.payload,
    pullInProgress: false,
  }),
  [ReduxActionTypes.GIT_PULL_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    pullMergeStatus: null,
    pullInProgress: true,
  }),
  [ReduxActionErrorTypes.GIT_PULL_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    pullInProgress: false,
    pullFailed: true,
    pullError: action.payload,
  }),
  [ReduxActionTypes.RESET_PULL_MERGE_STATUS]: (state: GitSyncReducerState) => ({
    ...state,
    pullFailed: false,
  }),
  [ReduxActionTypes.MERGE_BRANCH_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    isMerging: true,
    mergeError: null,
  }),
  [ReduxActionTypes.MERGE_BRANCH_SUCCESS]: (state: GitSyncReducerState) => ({
    ...state,
    isMerging: false,
    mergeError: null,
  }),
  [ReduxActionErrorTypes.MERGE_BRANCH_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    isMerging: false,
    mergeError: action.payload,
  }),
  [ReduxActionTypes.SET_REMOTE_URL_INPUT_VALUE]: (
    state: GitSyncReducerState,
    action: ReduxAction<string>,
  ) => {
    return {
      ...state,
      tempRemoteUrl: action.payload,
    };
  },
  [ReduxActionTypes.SET_SHOULD_SHOW_REPO_LIMIT_ERROR_MODAL]: (
    state: GitSyncReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    showRepoLimitErrorModal: action.payload,
  }),
  [ReduxActionTypes.SET_SHOULD_SHOW_DISCONNECT_GIT_MODAL]: (
    state: GitSyncReducerState,
    action: ReduxAction<boolean>,
  ) => ({
    ...state,
    isDisconnectGitModalOpen: action.payload,
  }),
  [ReduxActionTypes.SET_DISCONNECTING_GIT_APPLICATION]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    disconnectingGitApp: action.payload,
  }),
  [ReduxActionTypes.FETCH_SSH_KEY_PAIR_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GetSSHKeyResponseData>,
  ) => {
    return {
      ...state,
      SSHKeyPair: action.payload.publicKey,
      deployKeyDocUrl: action.payload.docUrl,
      supportedKeyTypes: action.payload?.gitSupportedSSHKeyType,
    };
  },
  [ReduxActionErrorTypes.FETCH_SSH_KEY_PAIR_ERROR]: (
    state: GitSyncReducerState,
  ) => {
    return {
      ...state,
      SSHKeyPair: null,
      deployKeyDocUrl: "",
      supportedKeyTypes: null,
    };
  },
  [ReduxActionTypes.CREATE_APPLICATION_SUCCESS]: (
    state: GitSyncReducerState,
  ) => {
    return {
      ...state,
      SSHKeyPair: null,
      deployKeyDocUrl: "",
    };
  },
  [ReduxActionTypes.GENERATE_SSH_KEY_PAIR_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GetSSHKeyResponseData>,
  ) => {
    return {
      ...state,
      SSHKeyPair: action.payload.publicKey,
      deployKeyDocUrl: action.payload.docUrl,
    };
  },
  [ReduxActionTypes.SET_WORKSPACE_ID_FOR_IMPORT]: (
    state: GitSyncReducerState,
  ) => {
    return {
      ...state,
      SSHKeyPair: "",
      tempRemoteUrl: "",
    };
  },
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isImportingApplicationViaGit: true,
    gitImportError: null,
  }),
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isImportingApplicationViaGit: false,
    gitImportError: null,
  }),
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_STATUS_RESET]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isImportingApplicationViaGit: false,
    gitImportError: null,
  }),
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_ERROR]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    gitImportError: action.payload,
  }),
  [ReduxActionTypes.RESET_SSH_KEY_PAIR]: (state: GitSyncReducerState) => ({
    ...state,
    SSHKeyPair: null,
  }),
  [ReduxActionTypes.GIT_INFO_INIT]: (state: GitSyncReducerState) => ({
    ...initialState,
    globalGitConfig: state.globalGitConfig,
    localGitConfig: state.localGitConfig,
  }),
  [ReduxActionTypes.DELETE_BRANCH_SUCCESS]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    deleteBranch: action.payload,
  }),
  [ReduxActionErrorTypes.DELETE_BRANCH_ERROR]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    deleteBranchError: action.payload,
  }),
  [ReduxActionErrorTypes.DELETE_BRANCH_WARNING]: (
    state: GitSyncReducerState,
    action: ReduxAction<string>,
  ) => ({
    ...state,
    deleteBranchWarning: action.payload,
  }),
  [ReduxActionTypes.DELETING_BRANCH]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    deletingBranch: action.payload,
  }),
  [ReduxActionTypes.GIT_DISCARD_CHANGES]: (state: GitSyncReducerState) => ({
    ...state,
    isDiscarding: true,
    discardError: null,
  }),
  [ReduxActionTypes.GIT_DISCARD_CHANGES_SUCCESS]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isDiscarding: false,
    discard: action.payload,
  }),
  [ReduxActionErrorTypes.GIT_DISCARD_CHANGES_ERROR]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isDiscarding: false,
    discardError: action.payload,
  }),
  [ReduxActionTypes.CLEAR_DISCARD_ERROR_STATE]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    discardError: null,
  }),
  [ReduxActionTypes.SWITCH_GIT_BRANCH_INIT]: (
    state: GitSyncReducerState,
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    action: ReduxAction<any>,
  ) => ({
    ...state,
    switchingToBranch: action.payload,
    isSwitchingBranch: true,
  }),
  [ReduxActionTypes.SWITCH_GIT_BRANCH_SUCCESS]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    switchingToBranch: null,
    isSwitchingBranch: false,
  }),
  [ReduxActionTypes.SWITCH_GIT_BRANCH_ERROR]: (state: GitSyncReducerState) => ({
    ...state,
    switchingToBranch: null,
    isSwitchingBranch: false,
  }),
  [ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    protectedBranchesLoading: true,
  }),
  [ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<{ protectedBranches: string[] }>,
  ) => ({
    ...state,
    protectedBranchesLoading: false,
    protectedBranches: action.payload.protectedBranches,
  }),
  [ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_ERROR]: (state) => ({
    ...state,
    protectedBranchesLoading: false,
  }),
  [ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_INIT]: (state) => ({
    ...state,
    isUpdateProtectedBranchesLoading: true,
  }),
  [ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_SUCCESS]: (state) => ({
    ...state,
    isUpdateProtectedBranchesLoading: false,
  }),
  [ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_ERROR]: (state) => ({
    ...state,
    isUpdateProtectedBranchesLoading: false,
  }),
  [ReduxActionTypes.GIT_SET_IS_AUTOCOMMIT_MODAL_OPEN]: (
    state,
    action: ReduxAction<{ isAutocommitModalOpen: boolean }>,
  ) => ({
    ...state,
    isAutocommitModalOpen: action.payload.isAutocommitModalOpen,
  }),
  [ReduxActionTypes.GIT_TOGGLE_AUTOCOMMIT_ENABLED_INIT]: (state) => ({
    ...state,
    togglingAutocommit: true,
  }),
  [ReduxActionTypes.GIT_TOGGLE_AUTOCOMMIT_ENABLED_SUCCESS]: (state) => ({
    ...state,
    togglingAutocommit: false,
  }),
  [ReduxActionErrorTypes.GIT_TOGGLE_AUTOCOMMIT_ENABLED_ERROR]: (state) => ({
    ...state,
    togglingAutocommit: false,
  }),
  [ReduxActionTypes.GIT_AUTOCOMMIT_TRIGGER_INIT]: (state) => ({
    ...state,
    triggeringAutocommit: true,
  }),
  [ReduxActionTypes.GIT_AUTOCOMMIT_TRIGGER_SUCCESS]: (state) => ({
    ...state,
    triggeringAutocommit: false,
  }),
  [ReduxActionErrorTypes.GIT_AUTOCOMMIT_TRIGGER_ERROR]: (state) => ({
    ...state,
    triggeringAutocommit: false,
  }),
  [ReduxActionTypes.GIT_AUTOCOMMIT_START_PROGRESS_POLLING]: (state) => ({
    ...state,
    pollingAutocommitStatus: true,
  }),
  [ReduxActionTypes.GIT_AUTOCOMMIT_STOP_PROGRESS_POLLING]: (state) => ({
    ...state,
    pollingAutocommitStatus: false,
  }),
  [ReduxActionErrorTypes.GIT_AUTOCOMMIT_PROGRESS_POLLING_ERROR]: (state) => ({
    ...state,
    pollingAutocommitStatus: false,
  }),
  [ReduxActionTypes.GIT_GET_METADATA_INIT]: (state) => ({
    ...state,
    gitMetadataLoading: true,
  }),
  [ReduxActionTypes.GIT_GET_METADATA_SUCCESS]: (
    state,
    action: ReduxAction<{ gitMetadata: GitMetadata }>,
  ) => ({
    ...state,
    gitMetadataLoading: false,
    gitMetadata: action.payload.gitMetadata,
  }),
  [ReduxActionErrorTypes.GIT_GET_METADATA_ERROR]: (state) => ({
    ...state,
    gitMetadataLoading: false,
  }),
  [ReduxActionTypes.GIT_SET_SETTINGS_MODAL_OPEN]: (
    state,
    action: ReduxAction<{ open: boolean; tab?: GitSettingsTab }>,
  ) => ({
    ...state,
    isGitSettingsModalOpen: action.payload.open,
    activeGitSettingsModalTab: action.payload.tab || GitSettingsTab.GENERAL,
  }),
  [ReduxActionTypes.GIT_SHOW_BRANCH_POPUP]: (
    state,
    action: ReduxAction<{ show: boolean }>,
  ) => ({
    ...state,
    showBranchPopup: action.payload.show,
  }),
});

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

export default gitSyncReducer;
