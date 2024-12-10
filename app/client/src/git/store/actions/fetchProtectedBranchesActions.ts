import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitProtectedBranches,
} from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export const fetchProtectedBranchesInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.protectedBranches.loading = true;
    state.apiResponses.protectedBranches.error = null;

    return state;
  },
);

export const fetchProtectedBranchesSuccessAction = createSingleArtifactAction(
  (
    state,
    action: GitArtifactPayloadAction<{
      protectedBranches: GitProtectedBranches;
    }>,
  ) => {
    state.apiResponses.protectedBranches.loading = false;
    state.apiResponses.protectedBranches.value =
      action.payload.protectedBranches;

    return state;
  },
);

export const fetchProtectedBranchesErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.protectedBranches.loading = false;
    state.apiResponses.protectedBranches.error = error;

    return state;
  },
);
