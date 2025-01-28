import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponseData,
} from "git/requests/generateSSHKeyRequest.types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";

export interface GenerateSSHKeyInitPayload
  extends GenerateSSHKeyRequestParams {}

export const generateSSHKeyInitAction =
  createArtifactAction<GenerateSSHKeyInitPayload>((state) => {
    state.apiResponses.generateSSHKey.loading = true;
    state.apiResponses.generateSSHKey.error = null;

    return state;
  });

export const generateSSHKeySuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<GenerateSSHKeyResponseData>
>((state, action) => {
  state.apiResponses.generateSSHKey.loading = false;
  state.apiResponses.generateSSHKey.error = null;
  state.apiResponses.sshKey.value = action.payload.responseData;

  return state;
});

export const generateSSHKeyErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.generateSSHKey.loading = false;
    state.apiResponses.generateSSHKey.error = error;

    return state;
  });

export const resetGenerateSSHKeyAction = createArtifactAction((state) => {
  state.apiResponses.generateSSHKey.loading = false;
  state.apiResponses.generateSSHKey.error = null;

  return state;
});
