import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const commitInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.commit.loading = true;
  state.apiResponses.commit.error = null;

  return state;
});

export const commitSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.commit.loading = false;

  return state;
});

export const commitErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.commit.loading = false;
    state.apiResponses.commit.error = error;

    return state;
  },
);
