import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface CreateReleaseTagInitPayload {
  tag: string;
  releaseNote: string;
  commitSHA: string;
}

export const createReleaseTagInitAction =
  createArtifactAction<CreateReleaseTagInitPayload>((state) => {
    state.apiResponses.createReleaseTag.loading = true;
    state.apiResponses.createReleaseTag.error = null;

    return state;
  });

export const createReleaseTagSuccessAction = createArtifactAction((state) => {
  state.apiResponses.createReleaseTag.loading = false;

  return state;
});

export const createReleaseTagErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.createReleaseTag.loading = false;
    state.apiResponses.createReleaseTag.error = error;

    return state;
  });
