import { ReduxActionTypes } from "constants/ReduxActionConstants";
import { ConnectToGitPayload } from "api/GitSyncAPI";
import { ReduxActionWithCallbacks } from "../constants/ReduxActionConstants";

export const setIsGitSyncModalOpen = (isOpen: boolean) => ({
  type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
  payload: isOpen,
});

export const commitToRepoInit = (payload: {
  commitMessage: string;
  pushImmediately: boolean;
}) => ({
  type: ReduxActionTypes.COMMIT_TO_GIT_REPO_INIT,
  payload,
});

export const commitToRepoSuccess = () => ({
  type: ReduxActionTypes.COMMIT_TO_GIT_REPO_SUCCESS,
});

export type ConnectToGitResponse = any;

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
