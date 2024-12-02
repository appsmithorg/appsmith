import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitStatus,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchStatusInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.status.loading = true;
  state.apiResponses.status.error = null;

  return state;
});

export const fetchStatusSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ status: GitStatus }>) => {
    state.apiResponses.status.loading = false;
    state.apiResponses.status.value = action.payload.status;

    return state;
  },
);

export const fetchStatusErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.status.loading = false;
    state.apiResponses.status.error = error;

    return state;
  },
);
