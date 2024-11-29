import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const deleteBranchInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.deleteBranch.loading = true;
  state.apiResponses.deleteBranch.error = null;

  return state;
});

export const deleteBranchSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.deleteBranch.loading = false;

  return state;
});

export const deleteBranchErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.deleteBranch.loading = false;
    state.apiResponses.deleteBranch.error = error;

    return state;
  },
);
