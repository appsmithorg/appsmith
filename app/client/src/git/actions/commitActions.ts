import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactErrorPayloadAction } from "../types";
import type { CommitRequestParams } from "git/requests/commitRequest.types";

export interface CommitInitPayload extends CommitRequestParams {}

export const commitInitAction = createSingleArtifactAction<CommitInitPayload>(
  (state) => {
    state.apiResponses.commit.loading = true;
    state.apiResponses.commit.error = null;

    return state;
  },
);

export const commitSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.commit.loading = false;

  return state;
});

export const commitErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.commit.loading = false;
    state.apiResponses.commit.error = error;

    return state;
  },
);
