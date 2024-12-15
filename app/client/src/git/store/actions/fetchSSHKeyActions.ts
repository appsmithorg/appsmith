import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { FetchSSHKeyResponseData } from "git/requests/fetchSSHKeyRequest.types";

export const fetchSSHKeyInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.sshKey.loading = true;
  state.apiResponses.sshKey.error = null;

  return state;
});

export const fetchSSHKeySuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchSSHKeyResponseData>
>((state, action) => {
  state.apiResponses.sshKey.loading = false;
  state.apiResponses.sshKey.error = null;
  state.apiResponses.sshKey.value = action.payload.responseData;

  return state;
});

export const fetchSSHKeyErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.sshKey.loading = false;
    state.apiResponses.sshKey.error = error;

    return state;
  });
