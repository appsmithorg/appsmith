import type { MergeRequestParams } from "git/requests/mergeRequest.types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface MergeInitPayload extends MergeRequestParams {
  artifactId: string;
}

export const mergeInitAction = createArtifactAction<MergeInitPayload>(
  (state) => {
    state.apiResponses.merge.loading = true;
    state.apiResponses.merge.error = null;

    return state;
  },
);

export const mergeSuccessAction = createArtifactAction((state) => {
  state.apiResponses.merge.loading = false;
  state.ui.mergeSuccess = true;

  return state;
});

export const mergeErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.merge.loading = false;
    state.apiResponses.merge.error = error;

    return state;
  },
);

export const resetMergeStateAction = createArtifactAction((state) => {
  state.apiResponses.merge.loading = false;
  state.apiResponses.merge.error = null;
  state.ui.mergeSuccess = false;

  return state;
});
