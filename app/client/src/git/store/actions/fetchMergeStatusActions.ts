import type { GitAsyncSuccessPayload, GitAsyncErrorPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type {
  FetchMergeStatusRequestParams,
  FetchMergeStatusResponseData,
} from "git/requests/fetchMergeStatusRequest.types";

export interface FetchMergeStatusInitPayload
  extends FetchMergeStatusRequestParams {
  artifactId: string;
}

export const fetchMergeStatusInitAction =
  createArtifactAction<FetchMergeStatusInitPayload>((state) => {
    state.apiResponses.mergeStatus.loading = true;
    state.apiResponses.mergeStatus.error = null;

    return state;
  });

export const fetchMergeStatusSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchMergeStatusResponseData>
>((state, action) => {
  state.apiResponses.mergeStatus.loading = false;
  state.apiResponses.mergeStatus.value = action.payload.responseData;

  return state;
});

export const fetchMergeStatusErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.mergeStatus.loading = false;
    state.apiResponses.mergeStatus.error = error;

    return state;
  });

export const clearMergeStatusAction = createArtifactAction((state) => {
  state.apiResponses.mergeStatus.loading = false;
  state.apiResponses.mergeStatus.error = null;
  state.apiResponses.mergeStatus.value = null;

  return state;
});
