import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const createBranchInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.createBranch.loading = true;
  state.apiResponses.createBranch.error = null;

  return state;
});

export const createBranchSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.createBranch.loading = false;

  return state;
});

export const createBranchErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.createBranch.loading = false;
    state.apiResponses.createBranch.error = error;

    return state;
  },
);
