import type {
  FetchStatusRequestParams,
  FetchStatusResponseData,
} from "git/requests/fetchStatusRequest.types";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";

export interface FetchStatusInitPayload extends FetchStatusRequestParams {}

export const fetchStatusInitAction =
  createSingleArtifactAction<FetchStatusInitPayload>((state) => {
    state.apiResponses.status.loading = true;
    state.apiResponses.status.error = null;

    return state;
  });

export const fetchStatusSuccessAction = createSingleArtifactAction<
  GitAsyncSuccessPayload<FetchStatusResponseData>
>((state, action) => {
  state.apiResponses.status.loading = false;
  state.apiResponses.status.value = action.payload.responseData;

  return state;
});

export const fetchStatusErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.status.loading = false;
    state.apiResponses.status.error = error;

    return state;
  });
