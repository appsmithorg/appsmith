import type {
  FetchGlobalSSHKeyRequestParams,
  FetchGlobalSSHKeyResponseData,
} from "git/requests/fetchGlobalSSHKeyRequest.types";
import type {
  GitAsyncSuccessPayload,
  GitAsyncErrorPayload,
  GitGlobalReduxState,
} from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export interface FetchGlobalSSHKeyInitPayload
  extends FetchGlobalSSHKeyRequestParams {}

export const fetchGlobalSSHKeyInitAction = (
  state: GitGlobalReduxState,
  // need action to better define action type
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: PayloadAction<FetchGlobalSSHKeyInitPayload>,
) => {
  state.globalSSHKey.loading = true;
  state.globalSSHKey.error = null;

  return state;
};

export const fetchGlobalSSHKeySuccessAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<GitAsyncSuccessPayload<FetchGlobalSSHKeyResponseData>>,
) => {
  state.globalSSHKey.loading = false;
  state.globalSSHKey.value = action.payload.responseData;

  return state;
};

export const fetchGlobalSSHKeyErrorAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.globalSSHKey.loading = false;
  state.globalSSHKey.error = error;

  return state;
};

export const resetGlobalSSHKeyAction = (state: GitGlobalReduxState) => {
  state.globalSSHKey.loading = false;
  state.globalSSHKey.value = null;
  state.globalSSHKey.error = null;

  return state;
};
