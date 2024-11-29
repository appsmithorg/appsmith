import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export const checkoutBranchInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.checkoutBranch.loading = true;
  state.apiResponses.checkoutBranch.error = null;

  return state;
});

export const checkoutBranchSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.checkoutBranch.loading = false;

    return state;
  },
);

export const checkoutBranchErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.checkoutBranch.loading = false;
    state.apiResponses.checkoutBranch.error = error;

    return state;
  },
);
