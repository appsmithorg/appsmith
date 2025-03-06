import type { CheckoutRefResponseData } from "git/requests/checkoutRefRequest.types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";

export interface CheckoutBranchInitPayload {
  artifactId: string;
  branchName: string;
}

export const checkoutBranchInitAction =
  createArtifactAction<CheckoutBranchInitPayload>((state, action) => {
    state.apiResponses.checkoutBranch.loading = true;
    state.apiResponses.checkoutBranch.error = null;
    state.ui.checkoutDestBranch = action.payload.branchName;

    return state;
  });

export type CheckoutBranchSuccessPayload =
  GitAsyncSuccessPayload<CheckoutRefResponseData>;

export const checkoutBranchSuccessAction =
  createArtifactAction<CheckoutBranchSuccessPayload>((state) => {
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
