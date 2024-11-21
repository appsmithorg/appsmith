import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const commitInitAction = createSingleArtifactAction((state) => {
  state.commit.loading = true;
  state.commit.error = null;

  return state;
});

export const commitSuccessAction = createSingleArtifactAction((state) => {
  state.commit.loading = false;

  return state;
});

export const commitErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.commit.loading = false;
    state.commit.error = error;

    return state;
  },
);
