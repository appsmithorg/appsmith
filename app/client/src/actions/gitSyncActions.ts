import { ReduxActionTypes } from "constants/ReduxActionConstants";

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

export const switchGitBranchInit = (branchName: string) => ({
  type: ReduxActionTypes.SWITCH_GIT_BRANCH_INIT,
  payload: branchName,
});

export const createNewBranchInit = (branchName: string) => ({
  type: ReduxActionTypes.CREATE_NEW_BRANCH_INIT,
  payload: branchName,
});
