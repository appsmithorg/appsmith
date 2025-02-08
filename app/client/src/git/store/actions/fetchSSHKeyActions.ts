import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { FetchSSHKeyResponseData } from "git/requests/fetchSSHKeyRequest.types";

export const fetchSSHKeyInitAction = createArtifactAction((state) => {
  state.apiResponses.sshKey.loading = true;
  state.apiResponses.sshKey.error = null;

  return state;
});

export const fetchSSHKeySuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchSSHKeyResponseData>
>((state, action) => {
  state.apiResponses.sshKey.loading = false;
  state.apiResponses.sshKey.error = null;
  state.apiResponses.sshKey.value = action.payload.responseData;

  return state;
});

export const fetchSSHKeyErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.sshKey.loading = false;
    state.apiResponses.sshKey.error = error;

    return state;
  });

export const resetFetchSSHKeyAction = createArtifactAction((state) => {
  state.apiResponses.sshKey.loading = false;
  state.apiResponses.sshKey.error = null;
  state.apiResponses.sshKey.value = null;

  return state;
});
