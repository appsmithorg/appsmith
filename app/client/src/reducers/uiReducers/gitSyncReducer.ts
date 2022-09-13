import { createReducer } from "utils/ReducerUtils";
import {
  ReduxAction,
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "@appsmith/constants/ReduxActionConstants";
import { GitConfig, GitSyncModalTab, MergeStatus } from "entities/GitSync";
import { GetSSHKeyResponseData, SSHKeyType } from "actions/gitSyncActions";

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

  isFetchingLocalGitConfig: false,
  isFetchingGitConfig: false,

  isMerging: false,
  tempRemoteUrl: "",

  showRepoLimitErrorModal: false,
  isDisconnectGitModalOpen: false,
  disconnectingGitApp: {
    id: "",
    name: "",
  },
};

const gitSyncReducer = createReducer(initialState, {
  [ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN]: (
    state: GitSyncReducerState,
    action: ReduxAction<{
      isOpen: boolean;
      tab: GitSyncModalTab;
    }>,
  ) => {
    const activeGitSyncModalTab = action.payload.tab;

    return {
      ...state,
      isGitSyncModalOpen: action.payload.isOpen,
      activeGitSyncModalTab,
      connectError: null,
      commitAndPushError: null,
      pullError: null,
      mergeError: null,
      pullFailed: false, // reset conflicts when the modal is opened
      gitImportError: null,
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
  }),
  [ReduxActionErrorTypes.COMMIT_TO_GIT_REPO_ERROR]: (
    state: GitSyncReducerState,
    action: ReduxAction<unknown>,
  ) => ({
    ...state,
    isCommitting: false,
    commitAndPushError: action.payload,
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
    isFetchingGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
  }),
  [ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGitConfig: false,
  }),
  [ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<GitConfig>,
  ) => ({
    ...state,
    globalGitConfig: action.payload,
    isFetchingGitConfig: false,
  }),
  [ReduxActionErrorTypes.UPDATE_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: false,
  }),
  [ReduxActionErrorTypes.FETCH_GLOBAL_GIT_CONFIG_ERROR]: (
    state: GitSyncReducerState,
  ) => ({
    ...state,
    isFetchingGitConfig: false,
  }),
  [ReduxActionTypes.FETCH_BRANCHES_INIT]: (state: GitSyncReducerState) => ({
    ...state,
    fetchingBranches: true,
    connectError: null,
    commitAndPushError: null,
    pullError: null,
    mergeError: null,
  }),
  [ReduxActionTypes.FETCH_BRANCHES_SUCCESS]: (
    state: GitSyncReducerState,
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
    commitAndPushError: null,
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
  [ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_ERROR]: (
    state: GitSyncReducerState,
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
    action: ReduxAction<any>,
  ) => ({
    ...state,
    deleteBranch: action.payload,
  }),
  [ReduxActionErrorTypes.DELETE_BRANCH_ERROR]: (
    state: GitSyncReducerState,
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
    action: ReduxAction<any>,
  ) => ({
    ...state,
    deletingBranch: action.payload,
  }),
  [ReduxActionTypes.GIT_DISCARD_CHANGES_SUCCESS]: (
    state: GitSyncReducerState,
    action: ReduxAction<any>,
  ) => ({
    ...state,
    isDiscarding: false,
    discard: action.payload,
  }),
});

export type GitStatusData = {
  aheadCount: number;
  behindCount: number;
  conflicting: Array<string>;
  isClean: boolean;
  modified: Array<string>;
  modifiedPages: number;
  modifiedQueries: number;
  remoteBranch: string;
  modifiedJSObjects: number;
  modifiedDatasources: number;
  discardDocUrl?: string;
};

type GitErrorPayloadType = {
  code: number;
  errorType?: string;
  message: string;
  referenceDoc?: string;
};

export type GitErrorType = {
  error: GitErrorPayloadType;
  show?: boolean;
  crash?: boolean;
  logToSentry?: boolean;
};

export type GitBranchDeleteState = {
  deleteBranch?: any;
  deleteBranchError?: any;
  deleteBranchWarning?: any;
  deletingBranch?: boolean;
};

export type GitDiscardResponse = {
  id: string;
  modifiedBy: string;
  userPermissions: string[];
  name: string;
  workspaceId: string;
  isPublic: boolean;
  pages: {
    id: string;
    isDefault: boolean;
    defaultPageId: string;
    default: boolean;
  }[];
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
};

export type GitSyncReducerState = GitBranchDeleteState & {
  isGitSyncModalOpen: boolean;
  isCommitting?: boolean;
  isCommitSuccessful: boolean;

  fetchingBranches: boolean;
  isFetchingGitConfig: boolean;
  isFetchingLocalGitConfig: boolean;

  isFetchingGitStatus: boolean;
  isFetchingMergeStatus: boolean;

  activeGitSyncModalTab: GitSyncModalTab;
  isErrorPopupVisible?: boolean;
  globalGitConfig: GitConfig;

  branches: Array<{ branchName: string; default: boolean }>;

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

  isDiscarding?: boolean;
  discard?: GitDiscardResponse;
};

export default gitSyncReducer;
