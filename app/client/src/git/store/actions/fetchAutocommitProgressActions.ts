import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitAutocommitProgress,
} from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export const fetchAutocommitProgressInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.autocommitProgress.loading = true;
    state.apiResponses.autocommitProgress.error = null;

    return state;
  },
);

export const fetchAutocommitProgressSuccessAction = createSingleArtifactAction(
  (
    state,
    action: GitArtifactPayloadAction<{
      autocommitProgress: GitAutocommitProgress;
    }>,
  ) => {
    state.apiResponses.autocommitProgress.loading = false;
    state.apiResponses.autocommitProgress.value =
      action.payload.autocommitProgress;

    return state;
  },
);

export const fetchAutocommitProgressErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.autocommitProgress.loading = false;
    state.apiResponses.autocommitProgress.error = error;

    return state;
  },
);
