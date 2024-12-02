import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const discardInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.discard.loading = true;
  state.apiResponses.discard.error = null;

  return state;
});

export const discardSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.discard.loading = false;

  return state;
});

export const discardErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.discard.loading = false;
    state.apiResponses.discard.error = error;

    return state;
  },
);
