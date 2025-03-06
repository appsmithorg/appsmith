import type { PullResponseData } from "git/requests/pullRequest.types";
import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";

export interface PullInitPayload {
  artifactId: string;
  showErrorInPopup?: boolean;
}

export const pullInitAction = createArtifactAction<PullInitPayload>((state) => {
  state.apiResponses.pull.loading = true;
  state.apiResponses.pull.error = null;

  return state;
});

export type PullSuccessPayload = GitAsyncSuccessPayload<
  PullResponseData["artifact"]
>;

export const pullSuccessAction = createArtifactAction<PullSuccessPayload>(
  (state) => {
    state.apiResponses.pull.loading = false;

    return state;
  },
);

export const pullErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.pull.loading = false;
    state.apiResponses.pull.error = error;

    return state;
  },
);
