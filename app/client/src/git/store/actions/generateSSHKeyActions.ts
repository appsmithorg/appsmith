import type {
  GenerateSSHKeyRequestParams,
  GenerateSSHKeyResponseData,
} from "git/requests/generateSSHKeyRequest.types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";

export interface GenerateSSHKeyInitPayload
  extends GenerateSSHKeyRequestParams {}

export const generateSSHKeyInitAction =
  createSingleArtifactAction<GenerateSSHKeyInitPayload>((state) => {
    state.apiResponses.generateSSHKey.loading = true;
    state.apiResponses.generateSSHKey.error = null;

    return state;
  });

export const generateSSHKeySuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<GenerateSSHKeyResponseData>
>((state, action) => {
  state.apiResponses.generateSSHKey.loading = false;
  state.apiResponses.generateSSHKey.error = null;
  state.apiResponses.sshKey.value = action.payload.responseData;

  return state;
});

export const generateSSHKeyErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.generateSSHKey.loading = false;
    state.apiResponses.generateSSHKey.error = error;

    return state;
  });

export const resetGenerateSSHKeyAction = createSingleArtifactAction((state) => {
  state.apiResponses.generateSSHKey.loading = false;
  state.apiResponses.generateSSHKey.error = null;

  return state;
});
