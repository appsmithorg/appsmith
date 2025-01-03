import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const disconnectInitAction = createArtifactAction((state) => {
  state.apiResponses.disconnect.loading = true;
  state.apiResponses.disconnect.error = null;

  return state;
});

export const disconnectSuccessAction = createArtifactAction((state) => {
  state.apiResponses.disconnect.loading = false;

  return state;
});

export const disconnectErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.disconnect.loading = false;
    state.apiResponses.disconnect.error = error;

    return state;
  },
);
