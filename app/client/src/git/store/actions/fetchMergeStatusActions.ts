import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitMergeStatus,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchMergeStatusInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.mergeStatus.loading = true;
    state.apiResponses.mergeStatus.error = null;

    return state;
  },
);

export const fetchMergeStatusSuccessAction = createSingleArtifactAction(
  (
    state,
    action: GitArtifactPayloadAction<{ mergeStatus: GitMergeStatus }>,
  ) => {
    state.apiResponses.mergeStatus.loading = false;
    state.apiResponses.mergeStatus.value = action.payload.mergeStatus;

    return state;
  },
);

export const fetchMergeStatusErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.mergeStatus.loading = false;
    state.apiResponses.mergeStatus.error = error;

    return state;
  },
);
