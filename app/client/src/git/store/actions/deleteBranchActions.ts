import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { DeleteBranchRequestParams } from "../../requests/deleteBranchRequest.types";

export interface DeleteBranchInitPayload extends DeleteBranchRequestParams {}

export const deleteBranchInitAction =
  createSingleArtifactAction<DeleteBranchInitPayload>((state) => {
    state.apiResponses.deleteBranch.loading = true;
    state.apiResponses.deleteBranch.error = null;

    return state;
  });

export const deleteBranchSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.deleteBranch.loading = false;

  return state;
});

export const deleteBranchErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.deleteBranch.loading = false;
    state.apiResponses.deleteBranch.error = error;

    return state;
  });
