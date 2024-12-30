import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { CheckoutBranchRequestParams } from "git/requests/checkoutBranchRequest.types";

export interface CheckoutBranchInitPayload extends CheckoutBranchRequestParams {
  artifactId: string;
}

export const checkoutBranchInitAction =
  createArtifactAction<CheckoutBranchInitPayload>((state, action) => {
    state.apiResponses.checkoutBranch.loading = true;
    state.apiResponses.checkoutBranch.error = null;
    state.ui.checkoutDestBranch = action.payload.branchName;

    return state;
  });

export const checkoutBranchSuccessAction = createArtifactAction((state) => {
  state.apiResponses.checkoutBranch.loading = false;
  state.apiResponses.checkoutBranch.error = null;
  state.ui.checkoutDestBranch = null;

  return state;
});

export const checkoutBranchErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.checkoutBranch.loading = false;
    state.apiResponses.checkoutBranch.error = error;
    state.ui.checkoutDestBranch = null;

    return state;
  });
