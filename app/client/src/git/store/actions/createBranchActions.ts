import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { CreateBranchRequestParams } from "git/requests/createBranchRequest.types";

export interface CreateBranchInitPayload extends CreateBranchRequestParams {}

export const createBranchInitAction =
  createSingleArtifactAction<CreateBranchInitPayload>((state) => {
    state.apiResponses.createBranch.loading = true;
    state.apiResponses.createBranch.error = null;

    return state;
  });

export const createBranchSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.createBranch.loading = false;

  return state;
});

export const createBranchErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.createBranch.loading = false;
    state.apiResponses.createBranch.error = error;

    return state;
  });
