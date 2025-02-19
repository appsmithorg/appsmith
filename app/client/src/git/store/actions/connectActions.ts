import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload, GitAsyncSuccessPayload } from "../types";
import type {
  ConnectRequestParams,
  ConnectResponseData,
} from "git/requests/connectRequest.types";

export interface ConnectInitPayload extends ConnectRequestParams {}

export const connectInitAction = createArtifactAction<ConnectInitPayload>(
  (state) => {
    state.apiResponses.connect.loading = true;
    state.apiResponses.connect.error = null;

    return state;
  },
);

export interface ConnectSuccessPayload
  extends GitAsyncSuccessPayload<ConnectResponseData> {}

export const connectSuccessAction = createArtifactAction<ConnectSuccessPayload>(
  (state) => {
    state.apiResponses.connect.loading = false;

    return state;
  },
);

export const connectErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.connect.loading = false;
    state.apiResponses.connect.error = error;

    return state;
  },
);

export const resetConnectAction = createArtifactAction((state) => {
  state.apiResponses.connect.loading = false;
  state.apiResponses.connect.error = null;

  return state;
});
