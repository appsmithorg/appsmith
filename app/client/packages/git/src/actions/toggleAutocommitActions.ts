import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const toggleAutocommitInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.toggleAutocommit.loading = true;
    state.apiResponses.toggleAutocommit.error = null;

    return state;
  },
);

export const toggleAutocommitSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.toggleAutocommit.loading = false;

    return state;
  },
);

export const toggleAutocommitErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.toggleAutocommit.loading = false;
    state.apiResponses.toggleAutocommit.error = error;

    return state;
  },
);
