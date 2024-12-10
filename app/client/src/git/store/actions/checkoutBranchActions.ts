import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { CheckoutBranchRequestParams } from "git/requests/checkoutBranchRequest.types";

export interface CheckoutBranchInitPayload
  extends CheckoutBranchRequestParams {}

export const checkoutBranchInitAction =
  createSingleArtifactAction<CheckoutBranchInitPayload>((state) => {
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

export const checkoutBranchErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.checkoutBranch.loading = false;
    state.apiResponses.checkoutBranch.error = error;

    return state;
  });
