import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const disconnectInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.disconnect.loading = true;
  state.apiResponses.disconnect.error = null;

  return state;
});

export const disconnectSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.disconnect.loading = false;

  return state;
});

export const disconnectErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.disconnect.loading = false;
    state.apiResponses.disconnect.error = error;

    return state;
  },
);
