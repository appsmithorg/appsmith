import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface TriggerAutocommitInitPayload {
  artifactId: string;
}

export const triggerAutocommitInitAction =
  createArtifactAction<TriggerAutocommitInitPayload>((state) => {
    state.apiResponses.triggerAutocommit.loading = true;
    state.apiResponses.triggerAutocommit.error = null;

    return state;
  });

export const triggerAutocommitSuccessAction = createArtifactAction((state) => {
  state.apiResponses.triggerAutocommit.loading = false;

  return state;
});

export const triggerAutocommitErrorAction =
  createArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.triggerAutocommit.loading = false;
    state.apiResponses.triggerAutocommit.error = error;

    return state;
  });

export const pollAutocommitProgressStartAction = createArtifactAction(
  (state) => {
    state.ui.autocommitPolling = true;

    return state;
  },
);

export const pollAutocommitProgressStopAction = createArtifactAction(
  (state) => {
    state.ui.autocommitPolling = false;

    return state;
  },
);
