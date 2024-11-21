import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const pullInitAction = createSingleArtifactAction((state) => {
  state.pull.loading = true;
  state.pull.error = null;

  return state;
});

export const pullSuccessAction = createSingleArtifactAction((state) => {
  state.pull.loading = false;

  return state;
});

export const pullErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.pull.loading = false;
    state.pull.error = error;

    return state;
  },
);
