import type {
  GitArtifactBasePayload,
  GitAsyncErrorPayload,
  GitGlobalReduxState,
} from "../types";
import type { PayloadAction } from "@reduxjs/toolkit";

export const updateGeneratedSSHKeyInitAction = (
  state: GitGlobalReduxState,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  action: PayloadAction<GitArtifactBasePayload>,
) => {
  state.updateGeneratedSSHKey.loading = true;
  state.updateGeneratedSSHKey.error = null;

  return state;
};

export const updateGeneratedSSHKeySuccessAction = (
  state: GitGlobalReduxState,
) => {
  state.updateGeneratedSSHKey.loading = false;
  state.updateGeneratedSSHKey.error = null;

  return state;
};

export const updateGeneratedSSHKeyErrorAction = (
  state: GitGlobalReduxState,
  action: PayloadAction<GitAsyncErrorPayload>,
) => {
  const { error } = action.payload;

  state.updateGeneratedSSHKey.loading = false;
  state.updateGeneratedSSHKey.error = error;

  return state;
};

export const resetUpdateGeneratedSSHKeyAction = (
  state: GitGlobalReduxState,
) => {
  state.updateGeneratedSSHKey.loading = false;
  state.updateGeneratedSSHKey.error = null;

  return state;
};
