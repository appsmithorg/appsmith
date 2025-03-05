import type {
  GitArtifactErrorPayloadAction,
  GitAsyncSuccessPayload,
} from "../types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { PretagResponseData } from "git/requests/pretagRequest.types";

export interface FetchLatestCommitInitPayload {
  artifactId: string;
}

export const pretagInitAction =
  createArtifactAction<FetchLatestCommitInitPayload>((state) => {
    state.apiResponses.pretag.loading = true;
    state.apiResponses.pretag.error = null;

    return state;
  });

export const pretagSuccessAction = createArtifactAction<
  GitAsyncSuccessPayload<PretagResponseData>
>((state, action) => {
  state.apiResponses.pretag.loading = false;
  state.apiResponses.pretag.value = action.payload.responseData;

  return state;
});

export const pretagErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.pretag.loading = false;
    state.apiResponses.pretag.error = error;

    return state;
  },
);
