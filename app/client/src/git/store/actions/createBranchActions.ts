import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface CreateBranchInitPayload {
  artifactId: string;
  branchName: string;
}

export const createBranchInitAction =
  createArtifactAction<CreateBranchInitPayload>((state) => {
    state.apiResponses.createBranch.loading = true;
    state.apiResponses.createBranch.error = null;

    return state;
  });

export const createBranchSuccessAction = createArtifactAction((state) => {
  state.apiResponses.createBranch.loading = false;

  return state;
});

export const createBranchErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.createBranch.loading = false;
    state.apiResponses.createBranch.error = error;

    return state;
  });
