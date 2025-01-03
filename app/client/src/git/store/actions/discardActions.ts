import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const discardInitAction = createArtifactAction((state) => {
  state.apiResponses.discard.loading = true;
  state.apiResponses.discard.error = null;

  return state;
});

export const discardSuccessAction = createArtifactAction((state) => {
  state.apiResponses.discard.loading = false;

  return state;
});

export const discardErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.discard.loading = false;
    state.apiResponses.discard.error = error;

    return state;
  },
);

export const clearDiscardErrorAction = createArtifactAction((state) => {
  state.apiResponses.discard.error = null;

  return state;
});
