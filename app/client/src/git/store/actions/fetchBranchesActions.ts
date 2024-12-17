import type {
  FetchBranchesRequestParams,
  FetchBranchesResponseData,
} from "../../requests/fetchBranchesRequest.types";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export interface FetchBranchesInitPayload extends FetchBranchesRequestParams {
  artifactId: string;
}

export const fetchBranchesInitAction =
  createSingleArtifactAction<FetchBranchesInitPayload>((state) => {
    state.apiResponses.branches.loading = true;
    state.apiResponses.branches.error = null;

    return state;
  });

export const fetchBranchesSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchBranchesResponseData>
>((state, action) => {
  state.apiResponses.branches.loading = false;
  state.apiResponses.branches.value = action.payload.responseData;

  return state;
});

export const fetchBranchesErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.branches.loading = false;
    state.apiResponses.branches.error = error;

    return state;
  });
