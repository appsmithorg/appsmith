import type { UpdateProtectedBranchesRequestParams } from "git/requests/updateProtectedBranchesRequest.types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";

export interface UpdateProtectedBranchesInitPayload
  extends UpdateProtectedBranchesRequestParams {}

export const updateProtectedBranchesInitAction =
  createArtifactAction<UpdateProtectedBranchesInitPayload>((state) => {
    state.apiResponses.updateProtectedBranches.loading = true;
    state.apiResponses.updateProtectedBranches.error = null;

    return state;
  });

export const updateProtectedBranchesSuccessAction = createArtifactAction(
  (state) => {
    state.apiResponses.updateProtectedBranches.loading = false;

    return state;
  },
);

export const updateProtectedBranchesErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.updateProtectedBranches.loading = false;
    state.apiResponses.updateProtectedBranches.error = error;

    return state;
  },
);
