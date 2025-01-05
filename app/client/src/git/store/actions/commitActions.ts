import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { CommitRequestParams } from "git/requests/commitRequest.types";

export interface CommitInitPayload extends CommitRequestParams {
  artifactId: string;
}

export const commitInitAction = createArtifactAction<CommitInitPayload>(
  (state) => {
    state.apiResponses.commit.loading = true;
    state.apiResponses.commit.error = null;

    return state;
  },
);

export const commitSuccessAction = createArtifactAction((state) => {
  state.apiResponses.commit.loading = false;

  return state;
});

export const commitErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.commit.loading = false;
    state.apiResponses.commit.error = error;

    return state;
  },
);

export const clearCommitErrorAction = createArtifactAction((state) => {
  state.apiResponses.commit.error = null;

  return state;
});
