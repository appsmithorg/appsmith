import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { FetchMetadataResponseData } from "git/requests/fetchMetadataRequest.types";

export const fetchMetadataInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.metadata.loading = true;
  state.apiResponses.metadata.error = null;

  return state;
});

export const fetchMetadataSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchMetadataResponseData>
>((state, action) => {
  state.apiResponses.metadata.loading = false;
  state.apiResponses.metadata.value = action.payload.responseData;

  return state;
});

export const fetchMetadataErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.metadata.loading = false;
    state.apiResponses.metadata.error = error;

    return state;
  });
