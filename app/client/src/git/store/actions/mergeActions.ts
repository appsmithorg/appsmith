import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const mergeInitAction = createArtifactAction((state) => {
  state.apiResponses.merge.loading = true;
  state.apiResponses.merge.error = null;

  return state;
});

export const mergeSuccessAction = createArtifactAction((state) => {
  state.apiResponses.merge.loading = false;

  return state;
});

export const mergeErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.merge.loading = false;
    state.apiResponses.merge.error = error;

    return state;
  },
);
