import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { CheckoutBranchRequestParams } from "git/requests/checkoutBranchRequest.types";

export interface CheckoutBranchInitPayload
  extends CheckoutBranchRequestParams {}

export const checkoutBranchInitAction =
  createSingleArtifactAction<CheckoutBranchInitPayload>((state, action) => {
    state.apiResponses.checkoutBranch.loading = true;
    state.apiResponses.checkoutBranch.error = null;
    state.ui.checkoutDestBranch = action.payload.branchName;

    return state;
  });

export const checkoutBranchSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.checkoutBranch.loading = false;
    state.apiResponses.checkoutBranch.error = null;
    state.ui.checkoutDestBranch = null;

    return state;
  },
);

export const checkoutBranchErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.checkoutBranch.loading = false;
    state.apiResponses.checkoutBranch.error = error;
    state.ui.checkoutDestBranch = null;

    return state;
  });
