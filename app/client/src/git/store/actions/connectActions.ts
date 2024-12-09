import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";

export interface ConnectInitPayload extends ConnectRequestParams {
  branchedPageId?: string;
}

export const connectInitAction = createSingleArtifactAction<ConnectInitPayload>(
  (state) => {
    state.apiResponses.connect.loading = true;
    state.apiResponses.connect.error = null;

    return state;
  },
);

export const connectSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.connect.loading = false;

  return state;
});

export const connectErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.connect.loading = false;
    state.apiResponses.connect.error = error;

    return state;
  });
