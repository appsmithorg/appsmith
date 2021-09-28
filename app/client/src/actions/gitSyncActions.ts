import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ConnectToGitPayload } from "api/GitSyncAPI";
import { ReduxActionWithCallbacks } from "../constants/ReduxActionConstants";
import { GitSyncModalTab, GitConfig } from "entities/GitSync";
import { GitApplicationMetadata } from "../api/ApplicationApi";

export const setIsGitSyncModalOpen = (payload: {
  isOpen: boolean;
  tab?: GitSyncModalTab;
}) => ({
  type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
  payload,
});

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

export const pushToRepoInit = () => ({
  type: ReduxActionTypes.PUSH_TO_GIT_INIT,
});

export const pushToRepoSuccess = () => ({
  type: ReduxActionTypes.PUSH_TO_GIT_SUCCESS,
});

export type ConnectToGitResponse = {
  gitApplicationMetadata: GitApplicationMetadata;
};

type ConnectToGitRequestParams = {
  payload: ConnectToGitPayload;
  onSuccessCallback?: (payload: ConnectToGitResponse) => void;
  onErrorCallback?: (error: string) => void;
};

export type ConnectToGitReduxAction = ReduxActionWithCallbacks<
  ConnectToGitPayload,
  ConnectToGitResponse,
  string
>;

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

export const switchGitBranchInit = (branchName: string) => ({
  type: ReduxActionTypes.SWITCH_GIT_BRANCH_INIT,
  payload: branchName,
});

export const createNewBranchInit = (branchName: string) => ({
  type: ReduxActionTypes.CREATE_NEW_BRANCH_INIT,
  payload: branchName,
});

export const setIsGitErrorPopupVisible = (payload: { isVisible: boolean }) => ({
  type: ReduxActionTypes.SHOW_ERROR_POPUP,
  payload,
});

export const showCreateBranchPopup = () => ({
  type: ReduxActionTypes.SHOW_CREATE_GIT_BRANCH_POPUP,
});

export const setIsImportAppViaGitModalOpen = (payload: {
  isOpen: boolean;
  organizationId?: string;
}) => ({
  type: ReduxActionTypes.SET_IS_IMPORT_APP_VIA_GIT_MODAL_OPEN,
  payload,
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
