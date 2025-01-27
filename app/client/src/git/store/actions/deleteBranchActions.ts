import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface DeleteBranchInitPayload {
  artifactId: string;
  branchName: string;
}

export const deleteBranchInitAction =
  createArtifactAction<DeleteBranchInitPayload>((state) => {
    state.apiResponses.deleteBranch.loading = true;
    state.apiResponses.deleteBranch.error = null;

    return state;
  });

export const deleteBranchSuccessAction = createArtifactAction((state) => {
  state.apiResponses.deleteBranch.loading = false;

  return state;
});

export const deleteBranchErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.deleteBranch.loading = false;
    state.apiResponses.deleteBranch.error = error;

    return state;
  });
