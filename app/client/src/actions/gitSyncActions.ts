import { ReduxActionTypes } from "constants/ReduxActionConstants";

export const setIsGitSyncModalOpen = (isOpen: boolean) => ({
  type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
  payload: isOpen,
});

export const fetchRepoDetailsInit = () => ({
  type: ReduxActionTypes.FETCH_GIT_REPO_DETAILS_INIT,
});

export const fetchRepoDetailsSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_GIT_REPO_DETAILS_INIT,
  payload,
});

export const updateRepoUrlInit = () => ({
  type: ReduxActionTypes.FETCH_REPO_URL_INIT,
});

export const updateRepoUrlSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_REPO_URL_SUCCESS,
  payload,
});

export const setRepoCredentialsInit = () => ({
  type: ReduxActionTypes.SET_REPO_CREDENTIALS_INIT,
});

export const setRepoCredentialsSuccess = () => ({
  type: ReduxActionTypes.SET_REPO_CREDENTIALS_SUCCESS,
});

export const downloadPublicKeyInit = () => ({
  type: ReduxActionTypes.DOWNLOAD_PUBLIC_KEY_INIT,
});

export const downloadPublicKeySuccess = () => ({
  type: ReduxActionTypes.DOWNLOAD_PUBLIC_KEY_SUCCESS,
});

export const testRepoAuthenticationInit = () => ({
  type: ReduxActionTypes.TEST_REPO_AUTH_INIT,
});

export const testRepoAuthenticationSuccess = () => ({
  type: ReduxActionTypes.TEST_REPO_AUTH_SUCCESS,
});

export const fetchLatestCommitInit = () => ({
  type: ReduxActionTypes.FETCH_LATEST_COMMIT_INIT,
});

export const fetchLatestCommitSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_LATEST_COMMIT_SUCCESS,
  payload,
});

export const fetchCommitsNotPushedInit = () => ({
  type: ReduxActionTypes.FETCH_COMMITS_NOT_PUSHED_INIT,
});

export const fetchCommitsNotPushedSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_COMMITS_NOT_PUSHED_SUCCESS,
  payload,
});

export const fetchIfUncommittedChangesInit = () => ({
  type: ReduxActionTypes.FETCH_IF_UNCOMMITTED_INIT,
});

export const fetchIfUncommittedChangesSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_IF_UNCOMMITTED_INIT,
  payload,
});
