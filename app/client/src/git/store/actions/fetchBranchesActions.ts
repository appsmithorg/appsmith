import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { FetchRefsResponseData } from "git/requests/fetchRefsRequest.types";

export interface FetchBranchesInitPayload {
  artifactId: string;
  pruneBranches?: boolean;
}

export const fetchBranchesInitAction =
  createArtifactAction<FetchBranchesInitPayload>((state) => {
    state.apiResponses.branches.loading = true;
    state.apiResponses.branches.error = null;

    return state;
  });

export const fetchBranchesSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchRefsResponseData>
>((state, action) => {
  state.apiResponses.branches.loading = false;
  state.apiResponses.branches.value = action.payload.responseData;

  return state;
});

export const fetchBranchesErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.branches.loading = false;
    state.apiResponses.branches.error = error;

    return state;
  });
