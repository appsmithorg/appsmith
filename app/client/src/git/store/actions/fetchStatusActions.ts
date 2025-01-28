import type {
  FetchStatusRequestParams,
  FetchStatusResponseData,
} from "git/requests/fetchStatusRequest.types";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";

export interface FetchStatusInitPayload extends FetchStatusRequestParams {
  artifactId: string;
}

export const fetchStatusInitAction =
  createArtifactAction<FetchStatusInitPayload>((state) => {
    state.apiResponses.status.loading = true;
    state.apiResponses.status.error = null;

    return state;
  });

export const fetchStatusSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchStatusResponseData>
>((state, action) => {
  state.apiResponses.status.loading = false;
  state.apiResponses.status.value = action.payload.responseData;

  return state;
});

export const fetchStatusErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.status.loading = false;
    state.apiResponses.status.error = error;

    return state;
  });
