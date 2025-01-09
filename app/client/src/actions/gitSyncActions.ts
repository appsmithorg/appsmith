import type { ReduxAction, ReduxActionWithCallbacks } from "./ReduxActionTypes";
import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "ee/constants/ReduxActionConstants";
import type {
  ConnectToGitPayload,
  GitAutocommitProgressResponse,
} from "api/GitSyncAPI";
import type { GitConfig, GitSyncModalTab, MergeStatus } from "entities/GitSync";
import type { GitApplicationMetadata } from "ee/api/ApplicationApi";
import {
  type GitStatusData,
  GitSettingsTab,
} from "reducers/uiReducers/gitSyncReducer";
import type { ResponseMeta } from "api/ApiResponses";

export interface GitStatusParams {
  compareRemote?: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSuccessCallback?: (data: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onErrorCallback?: (error: Error, response?: any) => void;
}

export const setIsGitSyncModalOpen = (payload: {
  isOpen: boolean;
  tab?: GitSyncModalTab;
  isDeploying?: boolean;
}) => {
  return {
    type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
    payload,
  };
};

export const setIsDisconnectGitModalOpen = (payload: boolean) => {
  return {
    type: ReduxActionTypes.SET_SHOULD_SHOW_DISCONNECT_GIT_MODAL,
    payload,
  };
};

export const commitToRepoInit = (payload: {
  commitMessage: string;
  doPush: boolean;
}) => ({
  type: ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT,
  payload,
});

export const commitToRepoSuccess = () => ({
  type: ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS,
});

export const clearCommitSuccessfulState = () => ({
  type: ReduxActionTypes.CLEAR_COMMIT_SUCCESSFUL_STATE,
});

export const clearCommitErrorState = () => ({
  type: ReduxActionTypes.CLEAR_COMMIT_ERROR_STATE,
});

export const clearDiscardErrorState = () => ({
  type: ReduxActionTypes.CLEAR_DISCARD_ERROR_STATE,
});

export interface ConnectToGitResponse {
  gitApplicationMetadata: GitApplicationMetadata;
}

interface ConnectToGitRequestParams {
  payload: ConnectToGitPayload;
  onSuccessCallback?: (payload: ConnectToGitResponse) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onErrorCallback?: (error: any, response?: any) => void;
}

export interface ConnectToGitReduxAction
  extends ReduxAction<ConnectToGitPayload> {
  onSuccessCallback?: (response: ConnectToGitResponse) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onErrorCallback?: (error: Error, response?: any) => void;
}

export const connectToGitInit = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: ConnectToGitRequestParams): ConnectToGitReduxAction => ({
  type: ReduxActionTypes.CONNECT_TO_GIT_INIT,
  payload,
  onSuccessCallback,
  onErrorCallback,
});

export const connectToGitSuccess = (payload: ConnectToGitResponse) => ({
  type: ReduxActionTypes.CONNECT_TO_GIT_SUCCESS,
  payload,
});

export const switchGitBranchInit = (branch: string) => ({
  type: ReduxActionTypes.SWITCH_GIT_BRANCH_INIT,
  payload: branch,
});

export const createNewBranchInit = ({
  branch,
  onErrorCallback,
  onSuccessCallback,
}: {
  branch: string;
  onSuccessCallback: () => void;
  onErrorCallback: () => void;
}) => ({
  type: ReduxActionTypes.CREATE_NEW_BRANCH_INIT,
  payload: branch,
  onErrorCallback,
  onSuccessCallback,
});

export const setIsGitErrorPopupVisible = (payload: { isVisible: boolean }) => ({
  type: ReduxActionTypes.SHOW_ERROR_POPUP,
  payload,
});

export const showCreateBranchPopup = () => ({
  type: ReduxActionTypes.SHOW_CREATE_GIT_BRANCH_POPUP,
});

export const updateGlobalGitConfigInit = (payload: GitConfig) => ({
  type: ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_INIT,
  payload,
});

export const updateGlobalGitConfigSuccess = (payload: GitConfig) => ({
  type: ReduxActionTypes.UPDATE_GLOBAL_GIT_CONFIG_SUCCESS,
  payload,
});

export const fetchGlobalGitConfigInit = () => ({
  type: ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_INIT,
});

export const fetchGlobalGitConfigSuccess = (payload: GitConfig) => ({
  type: ReduxActionTypes.FETCH_GLOBAL_GIT_CONFIG_SUCCESS,
  payload,
});

export const fetchBranchesInit = (payload?: { pruneBranches: boolean }) => ({
  type: ReduxActionTypes.FETCH_BRANCHES_INIT,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const fetchBranchesSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_BRANCHES_SUCCESS,
  payload,
});

// Local Git config is repo level
export const updateLocalGitConfigInit = (payload: GitConfig) => ({
  type: ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_INIT,
  payload,
});

export const updateLocalGitConfigSuccess = (payload: GitConfig) => ({
  type: ReduxActionTypes.UPDATE_LOCAL_GIT_CONFIG_SUCCESS,
  payload,
});

export const fetchLocalGitConfigInit = () => ({
  type: ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_INIT,
});

export const fetchLocalGitConfigSuccess = (payload: GitConfig) => ({
  type: ReduxActionTypes.FETCH_LOCAL_GIT_CONFIG_SUCCESS,
  payload,
});

export const fetchGitStatusInit = (payload?: GitStatusParams) => ({
  type: ReduxActionTypes.FETCH_GIT_STATUS_INIT,
  payload,
});

export const fetchGitStatusSuccess = (payload: GitStatusData) => ({
  type: ReduxActionTypes.FETCH_GIT_STATUS_SUCCESS,
  payload,
});

export const discardChanges = (
  payload: { successToastMessage?: string } | undefined | null = {},
) => ({
  type: ReduxActionTypes.GIT_DISCARD_CHANGES,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const discardChangesSuccess = (payload: any) => ({
  type: ReduxActionTypes.GIT_DISCARD_CHANGES_SUCCESS,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const discardChangesFailure = (payload: any) => ({
  type: ReduxActionErrorTypes.GIT_DISCARD_CHANGES_ERROR,
  payload: { error: payload.error, show: false },
});

export const updateBranchLocally = (payload: string) => ({
  type: ReduxActionTypes.UPDATE_BRANCH_LOCALLY,
  payload,
});

interface MergeBranchPayload {
  sourceBranch: string;
  destinationBranch: string;
}

export const mergeBranchInit = (params: {
  payload: { sourceBranch: string; destinationBranch: string };
  onSuccessCallback: () => void;
}) => ({
  type: ReduxActionTypes.MERGE_BRANCH_INIT,
  ...params,
});

export const mergeBranchSuccess = () => ({
  type: ReduxActionTypes.MERGE_BRANCH_SUCCESS,
});

export const mergeBranchFailure = () => ({
  type: ReduxActionErrorTypes.MERGE_BRANCH_ERROR,
});

export const fetchMergeStatusInit = (payload: MergeBranchPayload) => ({
  type: ReduxActionTypes.FETCH_MERGE_STATUS_INIT,
  payload,
});

export const fetchMergeStatusSuccess = (payload: MergeStatus) => ({
  type: ReduxActionTypes.FETCH_MERGE_STATUS_SUCCESS,
  payload,
});

export const fetchMergeStatusFailure = (payload: {
  error: string;
  show: boolean;
}) => ({
  type: ReduxActionErrorTypes.FETCH_MERGE_STATUS_ERROR,
  payload,
});

export const resetMergeStatus = () => ({
  type: ReduxActionTypes.RESET_MERGE_STATUS,
});

export const gitPullInit = (payload?: {
  triggeredFromBottomBar?: boolean;
}) => ({
  type: ReduxActionTypes.GIT_PULL_INIT,
  payload,
});

export const gitPullSuccess = (mergeStatus: MergeStatus) => ({
  type: ReduxActionTypes.GIT_PULL_SUCCESS,
  payload: mergeStatus,
});

export const resetPullMergeStatus = () => ({
  type: ReduxActionTypes.RESET_PULL_MERGE_STATUS,
});

export const remoteUrlInputValue = (payload?: { tempRemoteUrl?: string }) => ({
  type: ReduxActionTypes.SET_REMOTE_URL_INPUT_VALUE,
  payload,
});

export const setShowRepoLimitErrorModal = (payload: boolean) => ({
  type: ReduxActionTypes.SET_SHOULD_SHOW_REPO_LIMIT_ERROR_MODAL,
  payload,
});

export const showConnectGitModal = () => ({
  type: ReduxActionTypes.SHOW_CONNECT_GIT_MODAL,
});

export const revokeGit = () => ({
  type: ReduxActionTypes.REVOKE_GIT,
});

export const setDisconnectingGitApplication = (payload: {
  id: string;
  name: string;
}) => ({
  type: ReduxActionTypes.SET_DISCONNECTING_GIT_APPLICATION,
  payload,
});

export const importAppFromGit = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: ConnectToGitRequestParams): ConnectToGitReduxAction => ({
  type: ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_INIT,
  payload,
  onSuccessCallback,
  onErrorCallback,
});

type ErrorPayload = string;

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

export interface GenerateSSHKeyPairResponsePayload<T> {
  responseMeta: ResponseMeta;
  data: T;
}

export type GenerateSSHKeyPairReduxAction = ReduxActionWithCallbacks<
  { keyType?: string } | undefined,
  GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ErrorPayload
>;

export interface GenerateKeyParams {
  onErrorCallback?: (payload: ErrorPayload) => void;
  onSuccessCallback?: (
    payload: GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ) => void;
  payload?: { keyType?: string };
}

export const generateSSHKeyPair = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: GenerateKeyParams): GenerateSSHKeyPairReduxAction => ({
  type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_INIT,
  payload,
  onErrorCallback,
  onSuccessCallback,
});

export const generateSSHKeyPairSuccess = (
  payload: GenerateSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
) => {
  return {
    type: ReduxActionTypes.GENERATE_SSH_KEY_PAIR_SUCCESS,
    payload,
  };
};

export interface GetSSHKeyPairResponsePayload<T> {
  responseMeta: ResponseMeta;
  data: T;
}

export type GetSSHKeyPairReduxAction = ReduxActionWithCallbacks<
  undefined,
  GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ErrorPayload
>;

export interface GetKeyParams {
  onErrorCallback?: (payload: ErrorPayload) => void;
  onSuccessCallback?: (
    payload: GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
  ) => void;
  payload?: undefined;
}

export const getSSHKeyPair = ({
  onErrorCallback,
  onSuccessCallback,
  payload,
}: GetKeyParams): GetSSHKeyPairReduxAction => {
  return {
    type: ReduxActionTypes.FETCH_SSH_KEY_PAIR_INIT,
    payload,
    onErrorCallback,
    onSuccessCallback,
  };
};

export const getSSHKeyPairSuccess = (
  payload: GetSSHKeyPairResponsePayload<GetSSHKeyResponseData>,
) => {
  return {
    type: ReduxActionTypes.FETCH_SSH_KEY_PAIR_SUCCESS,
    payload,
  };
};

export const getSSHKeyPairError = (payload: {
  error: string;
  show: boolean;
}) => {
  return {
    type: ReduxActionErrorTypes.FETCH_SSH_KEY_PAIR_ERROR,
    payload,
  };
};

export const initSSHKeyPairWithNull = () => ({
  type: ReduxActionTypes.INIT_SSH_KEY_PAIR_WITH_NULL,
});

export const importAppViaGitSuccess = () => ({
  type: ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_SUCCESS,
});
export const importAppViaGitStatusReset = () => ({
  type: ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_STATUS_RESET,
});

// todo define type
// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const importAppViaGitError = (error: any) => ({
  type: ReduxActionTypes.IMPORT_APPLICATION_FROM_GIT_ERROR,
  payload: error,
});

export const resetSSHKeys = () => ({
  type: ReduxActionTypes.RESET_SSH_KEY_PAIR,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteBranchInit = (payload: any) => ({
  type: ReduxActionTypes.DELETE_BRANCH_INIT,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteBranchSuccess = (payload: any) => ({
  type: ReduxActionTypes.DELETE_BRANCH_SUCCESS,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteBranchError = (payload: any) => ({
  type: ReduxActionErrorTypes.DELETE_BRANCH_ERROR,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deleteBranchWarning = (payload: any) => ({
  type: ReduxActionErrorTypes.DELETE_BRANCH_WARNING,
  payload,
});

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const deletingBranch = (payload: any) => ({
  type: ReduxActionTypes.DELETING_BRANCH,
  payload,
});

export const updateGitDefaultBranch = (payload: { branchName: string }) => {
  return {
    type: ReduxActionTypes.GIT_UPDATE_DEFAULT_BRANCH_INIT,
    payload,
  };
};

export const fetchGitProtectedBranchesInit = () => {
  return {
    type: ReduxActionTypes.GIT_FETCH_PROTECTED_BRANCHES_INIT,
  };
};

export const updateGitProtectedBranchesInit = (payload: {
  protectedBranches: string[];
}) => {
  return {
    type: ReduxActionTypes.GIT_UPDATE_PROTECTED_BRANCHES_INIT,
    payload,
  };
};

export const setShowBranchPopupAction = (show: boolean) => {
  return {
    type: ReduxActionTypes.GIT_SHOW_BRANCH_POPUP,
    payload: { show },
  };
};

// START autocommit
export const toggleAutocommitEnabledInit = () => ({
  type: ReduxActionTypes.GIT_TOGGLE_AUTOCOMMIT_ENABLED_INIT,
});

export const setIsAutocommitModalOpen = (isAutocommitModalOpen: boolean) => ({
  type: ReduxActionTypes.GIT_SET_IS_AUTOCOMMIT_MODAL_OPEN,
  payload: { isAutocommitModalOpen },
});

export const triggerAutocommitInitAction = () => ({
  type: ReduxActionTypes.GIT_AUTOCOMMIT_TRIGGER_INIT,
});

export const triggerAutocommitSuccessAction = () => ({
  type: ReduxActionTypes.GIT_AUTOCOMMIT_TRIGGER_SUCCESS,
});

export interface TriggerAutocommitErrorActionPayload {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  show: boolean;
}

export const triggerAutocommitErrorAction = (
  payload: TriggerAutocommitErrorActionPayload,
) => ({
  type: ReduxActionErrorTypes.GIT_AUTOCOMMIT_TRIGGER_ERROR,
  payload,
});

export const startAutocommitProgressPollingAction = () => ({
  type: ReduxActionTypes.GIT_AUTOCOMMIT_START_PROGRESS_POLLING,
});

export const stopAutocommitProgressPollingAction = () => ({
  type: ReduxActionTypes.GIT_AUTOCOMMIT_STOP_PROGRESS_POLLING,
});

export type SetAutocommitActionPayload = GitAutocommitProgressResponse;

export const setAutocommitProgressAction = (
  payload: SetAutocommitActionPayload,
) => ({
  type: ReduxActionTypes.GIT_SET_AUTOCOMMIT_PROGRESS,
  payload,
});

export const resetAutocommitProgressAction = () => ({
  type: ReduxActionTypes.GIT_RESET_AUTOCOMMIT_PROGRESS,
});

export interface AutocommitProgressErrorActionPayload {
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  error: any;
  show: boolean;
}

export const autoCommitProgressErrorAction = (
  payload: AutocommitProgressErrorActionPayload,
) => ({
  type: ReduxActionErrorTypes.GIT_AUTOCOMMIT_PROGRESS_POLLING_ERROR,
  payload,
});
// END autocommit

export const getGitMetadataInitAction = () => ({
  type: ReduxActionTypes.GIT_GET_METADATA_INIT,
});

export const setGitSettingsModalOpenAction = (payload: {
  open: boolean;
  tab?: GitSettingsTab;
}) => ({
  type: ReduxActionTypes.GIT_SET_SETTINGS_MODAL_OPEN,
  payload: { open: payload.open, tab: payload.tab || GitSettingsTab.GENERAL },
});
