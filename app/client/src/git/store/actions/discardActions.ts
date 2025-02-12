import { createArtifactAction } from "../helpers/createArtifactAction";
import type {
  GitArtifactBasePayload,
  GitArtifactErrorPayloadAction,
} from "../types";

export interface DiscardInitPayload extends GitArtifactBasePayload {
  artifactId: string;
  successMessage?: string;
}

export const discardInitAction = createArtifactAction<DiscardInitPayload>(
  (state) => {
    state.apiResponses.discard.loading = true;
    state.apiResponses.discard.error = null;

    return state;
  },
);

export const discardSuccessAction = createArtifactAction((state) => {
  state.apiResponses.discard.loading = false;

  return state;
});

export const discardErrorAction = createArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.discard.loading = false;
    state.apiResponses.discard.error = error;

    return state;
  },
);

export const clearDiscardErrorAction = createArtifactAction((state) => {
  state.apiResponses.discard.error = null;

  return state;
});
