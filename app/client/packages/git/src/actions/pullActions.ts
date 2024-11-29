import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const pullInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.pull.loading = true;
  state.apiResponses.pull.error = null;

  return state;
});

export const pullSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.pull.loading = false;

  return state;
});

export const pullErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.pull.loading = false;
    state.apiResponses.pull.error = error;

    return state;
  },
);
