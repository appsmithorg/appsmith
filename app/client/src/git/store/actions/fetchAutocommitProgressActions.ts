import type { GitAsyncErrorPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";

export const fetchAutocommitProgressInitAction = createArtifactAction(
  (state) => {
    state.apiResponses.autocommitProgress.loading = true;
    state.apiResponses.autocommitProgress.error = null;

    return state;
  },
);

export const fetchAutocommitProgressSuccessAction = createArtifactAction(
  (state) => {
    state.apiResponses.autocommitProgress.loading = false;

    return state;
  },
);

export const fetchAutocommitProgressErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.autocommitProgress.loading = false;
    state.apiResponses.autocommitProgress.error = error;

    return state;
  });
