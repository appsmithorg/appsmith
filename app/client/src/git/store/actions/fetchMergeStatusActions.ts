import type { GitAsyncSuccessPayload, GitAsyncErrorPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type {
  FetchMergeStatusRequestParams,
  FetchMergeStatusResponseData,
} from "git/requests/fetchMergeStatusRequest.types";

export interface FetchMergeStatusInitPayload
  extends FetchMergeStatusRequestParams {
  artifactId: string;
}

export const fetchMergeStatusInitAction =
  createSingleArtifactAction<FetchMergeStatusInitPayload>((state) => {
    state.apiResponses.mergeStatus.loading = true;
    state.apiResponses.mergeStatus.error = null;

    return state;
  });

export const fetchMergeStatusSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchMergeStatusResponseData>
>((state, action) => {
  state.apiResponses.mergeStatus.loading = false;
  state.apiResponses.mergeStatus.value = action.payload.responseData;

  return state;
});

export const fetchMergeStatusErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.mergeStatus.loading = false;
    state.apiResponses.mergeStatus.error = error;

    return state;
  });

export const clearMergeStatusAction = createSingleArtifactAction((state) => {
  state.apiResponses.mergeStatus.loading = false;
  state.apiResponses.mergeStatus.error = null;
  state.apiResponses.mergeStatus.value = null;

  return state;
});
