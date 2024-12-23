import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";
import type { ConnectRequestParams } from "git/requests/connectRequest.types";

export interface ConnectInitPayload extends ConnectRequestParams {
  branchedPageId?: string;
}

export const connectInitAction = createArtifactAction<ConnectInitPayload>(
  (state) => {
    state.apiResponses.connect.loading = true;
    state.apiResponses.connect.error = null;

    return state;
  },
);

export const connectSuccessAction = createArtifactAction((state) => {
  state.apiResponses.connect.loading = false;

  return state;
});

export const connectErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.connect.loading = false;
    state.apiResponses.connect.error = error;

    return state;
  },
);
