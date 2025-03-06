import type {
  GitArtifactErrorPayloadAction,
  GitAsyncSuccessPayload,
} from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { FetchLatestCommitResponseData } from "git/requests/fetchLatestCommitRequest.types";

export interface FetchLatestCommitInitPayload {
  artifactId: string;
}

export const fetchLatestCommitInitAction =
  createArtifactAction<FetchLatestCommitInitPayload>((state) => {
    state.apiResponses.latestCommit.loading = true;
    state.apiResponses.latestCommit.error = null;

    return state;
  });

export const fetchLatestCommitSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<FetchLatestCommitResponseData>
>((state, action) => {
  state.apiResponses.latestCommit.loading = false;
  state.apiResponses.latestCommit.value = action.payload.responseData;

  return state;
});

export const fetchLatestCommitErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.latestCommit.loading = false;
    state.apiResponses.latestCommit.error = error;

    return state;
  },
);
