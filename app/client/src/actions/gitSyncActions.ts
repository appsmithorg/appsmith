import {
  ReduxActionErrorTypes,
  ReduxActionTypes,
} from "constants/ReduxActionConstants";

export const setIsGitSyncModalOpen = (isOpen: boolean) => ({
  type: ReduxActionTypes.SET_IS_GIT_SYNC_MODAL_OPEN,
  payload: isOpen,
});

export const fetchRepoDetailsInit = () => ({
  type: ReduxActionTypes.FETCH_GIT_REPO_DETAILS_INIT,
});

export const fetchRepoDetailsSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_GIT_REPO_DETAILS_SUCCESS,
  payload,
});

export const fetchRepoDetailsError = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_REPO_DETAILS_ERROR,
  payload: { error },
});

export const updateRepoUrlInit = () => ({
  type: ReduxActionTypes.UPDATE_REPO_URL_INIT,
});

export const updateRepoUrlSuccess = (payload: any) => ({
  type: ReduxActionTypes.UPDATE_REPO_URL_SUCCESS,
  payload,
});

export const updateRepoUrlError = (payload: string) => ({
  type: ReduxActionErrorTypes.UPDATE_REPO_URL_ERROR,
  payload,
});

export const downloadPublicKeyInit = () => ({
  type: ReduxActionTypes.DOWNLOAD_PUBLIC_KEY_INIT,
});

export const downloadPublicKeySuccess = () => ({
  type: ReduxActionTypes.DOWNLOAD_PUBLIC_KEY_SUCCESS,
});

export const downloadPublicKeyError = (error: any) => ({
  type: ReduxActionErrorTypes.DOWNLOAD_PUBLIC_KEY_ERROR,
  payload: { error },
});

export const testRepoAuthenticationInit = (payload?: {
  username: string;
  password: string;
}) => ({
  type: ReduxActionTypes.TEST_REPO_AUTH_INIT,
  payload,
});

export const testRepoAuthenticationSuccess = () => ({
  type: ReduxActionTypes.TEST_REPO_AUTH_SUCCESS,
});

export const testRepoAuthenticationError = (error: any) => ({
  type: ReduxActionTypes.TEST_REPO_AUTH_ERROR,
  payload: { error },
});

export const fetchGitStatusInit = () => ({
  type: ReduxActionTypes.FETCH_GIT_STATUS_INIT,
});

export const fetchGitStatusSuccess = (payload: any) => ({
  type: ReduxActionTypes.FETCH_GIT_STATUS_SUCCESS,
  payload,
});

export const fetchGitStatusError = (error: any) => ({
  type: ReduxActionErrorTypes.FETCH_GIT_STATUS_ERROR,
  payload: { error },
});
