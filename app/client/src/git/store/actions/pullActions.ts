import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface PullInitPayload {
  artifactId: string;
}

export const pullInitAction = createSingleArtifactAction<PullInitPayload>(
  (state) => {
    state.apiResponses.pull.loading = true;
    state.apiResponses.pull.error = null;

    return state;
  },
);

export const pullSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.pull.loading = false;

  return state;
});

export const pullErrorAction = createSingleArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.pull.loading = false;
    state.apiResponses.pull.error = error;

    return state;
  },
);
