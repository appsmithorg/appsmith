import type { GitAsyncErrorPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export const fetchAutocommitProgressInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.autocommitProgress.loading = true;
    state.apiResponses.autocommitProgress.error = null;

    return state;
  },
);

export const fetchAutocommitProgressSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.autocommitProgress.loading = false;

    return state;
  },
);

export const fetchAutocommitProgressErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.autocommitProgress.loading = false;
    state.apiResponses.autocommitProgress.error = error;

    return state;
  });
