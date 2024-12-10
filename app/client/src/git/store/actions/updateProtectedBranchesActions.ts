import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const updateProtectedBranchesInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateProtectedBranches.loading = true;
    state.apiResponses.updateProtectedBranches.error = null;

    return state;
  },
);

export const updateProtectedBranchesSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateProtectedBranches.loading = false;

    return state;
  },
);

export const updateProtectedBranchesErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.updateProtectedBranches.loading = false;
    state.apiResponses.updateProtectedBranches.error = error;

    return state;
  },
);
