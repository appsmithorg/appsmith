import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitSSHKey,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchSSHKeyInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.sshKey.loading = true;
  state.apiResponses.sshKey.error = null;

  return state;
});

export const fetchSSHKeySuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ sshKey: GitSSHKey }>) => {
    state.apiResponses.sshKey.loading = false;
    state.apiResponses.sshKey.value = action.payload.sshKey;

    return state;
  },
);

export const fetchSSHKeyErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.sshKey.loading = false;
    state.apiResponses.sshKey.error = error;

    return state;
  },
);
