import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export interface TriggerAutocommitInitPayload {
  artifactId: string;
}

export const triggerAutocommitInitAction =
  createSingleArtifactAction<TriggerAutocommitInitPayload>((state) => {
    state.apiResponses.triggerAutocommit.loading = true;
    state.apiResponses.triggerAutocommit.error = null;

    return state;
  });

export const triggerAutocommitSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.triggerAutocommit.loading = false;

    return state;
  },
);

export const triggerAutocommitErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.triggerAutocommit.loading = false;
    state.apiResponses.triggerAutocommit.error = error;

    return state;
  });

export const pollAutocommitProgressStartAction = createSingleArtifactAction(
  (state) => {
    state.ui.autocommitPolling = true;

    return state;
  },
);

export const pollAutcommitProgressStopAction = createSingleArtifactAction(
  (state) => {
    state.ui.autocommitPolling = false;

    return state;
  },
);
