import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const connectInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.connect.loading = true;
  state.apiResponses.connect.error = null;

  return state;
});

export const connectSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.connect.loading = false;

  return state;
});

export const connectErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.connect.loading = false;
    state.apiResponses.connect.error = error;

    return state;
  },
);
