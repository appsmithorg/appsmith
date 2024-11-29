import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const generateSSHKeyInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.generateSSHKey.loading = true;
  state.apiResponses.generateSSHKey.error = null;

  return state;
});

export const generateSSHKeySuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.generateSSHKey.loading = false;

    return state;
  },
);

export const generateSSHKeyErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.generateSSHKey.loading = false;
    state.apiResponses.generateSSHKey.error = error;

    return state;
  },
);
