import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { FetchMetadataResponseData } from "git/requests/fetchMetadataRequest.types";

export const fetchMetadataInitAction = createArtifactAction((state) => {
  state.apiResponses.metadata.loading = true;
  state.apiResponses.metadata.error = null;

  return state;
});

export const fetchMetadataSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchMetadataResponseData>
>((state, action) => {
  state.apiResponses.metadata.loading = false;
  state.apiResponses.metadata.value = action.payload.responseData;

  return state;
});

export const fetchMetadataErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.metadata.loading = false;
    state.apiResponses.metadata.error = error;

    return state;
  });
