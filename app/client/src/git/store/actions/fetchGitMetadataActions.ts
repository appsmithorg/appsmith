import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { FetchGitMetadataResponseData } from "git/requests/fetchGitMetadataRequest.types";

export const fetchGitMetadataInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.metadata.loading = true;
    state.apiResponses.metadata.error = null;

    return state;
  },
);

export const fetchGitMetadataSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchGitMetadataResponseData>
>((state, action) => {
  state.apiResponses.metadata.loading = false;
  state.apiResponses.metadata.value = action.payload.responseData;

  return state;
});

export const fetchGitMetadataErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.metadata.loading = false;
    state.apiResponses.metadata.error = error;

    return state;
  });
