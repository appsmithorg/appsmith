import type { GitArtifactPayloadAction, GitStatus } from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchStatusInitAction = createSingleArtifactAction((state) => {
  state.status.loading = true;
  state.status.error = null;

  return state;
});

export const fetchStatusSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ status: GitStatus }>) => {
    state.status.loading = false;
    state.status.value = action.payload.status;

    return state;
  },
);

export const fetchStatusErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.status.loading = false;
    state.status.error = error;

    return state;
  },
);
