import type { GitAsyncSuccessPayload, GitAsyncErrorPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { FetchProtectedBranchesResponseData } from "git/requests/fetchProtectedBranchesRequest.types";

export const fetchProtectedBranchesInitAction = createArtifactAction(
  (state) => {
    state.apiResponses.protectedBranches.loading = true;
    state.apiResponses.protectedBranches.error = null;

    return state;
  },
);

export const fetchProtectedBranchesSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchProtectedBranchesResponseData>
>((state, action) => {
  state.apiResponses.protectedBranches.loading = false;
  state.apiResponses.protectedBranches.value = action.payload.responseData;

  return state;
});

export const fetchProtectedBranchesErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.protectedBranches.loading = false;
    state.apiResponses.protectedBranches.error = error;

    return state;
  });
