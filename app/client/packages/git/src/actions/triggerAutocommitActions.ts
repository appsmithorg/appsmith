import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const triggerAutocommitInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.triggerAutocommit.loading = true;
    state.apiResponses.triggerAutocommit.error = null;

    return state;
  },
);

export const triggerAutocommitSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.triggerAutocommit.loading = false;

    return state;
  },
);

export const triggerAutocommitErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.triggerAutocommit.loading = false;
    state.apiResponses.triggerAutocommit.error = error;

    return state;
  },
);
