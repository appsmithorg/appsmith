import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const connectInitAction = createSingleArtifactAction((state) => {
  state.connect.loading = true;
  state.connect.error = null;

  return state;
});

export const connectSuccessAction = createSingleArtifactAction((state) => {
  state.connect.loading = false;

  return state;
});

export const connectErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.connect.loading = false;
    state.connect.error = error;

    return state;
  },
);
