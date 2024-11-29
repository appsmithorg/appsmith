import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const mergeInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.merge.loading = true;
  state.apiResponses.merge.error = null;

  return state;
});

export const mergeSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.merge.loading = false;

  return state;
});

export const mergeErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.merge.loading = false;
    state.apiResponses.merge.error = error;

    return state;
  },
);
