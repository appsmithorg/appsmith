import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const toggleAutocommitInitAction = createArtifactAction((state) => {
  state.apiResponses.toggleAutocommit.loading = true;
  state.apiResponses.toggleAutocommit.error = null;

  return state;
});

export const toggleAutocommitSuccessAction = createArtifactAction((state) => {
  state.apiResponses.toggleAutocommit.loading = false;

  return state;
});

export const toggleAutocommitErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.toggleAutocommit.loading = false;
    state.apiResponses.toggleAutocommit.error = error;

    return state;
  },
);
