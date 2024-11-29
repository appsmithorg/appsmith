import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const updateLocalConfigInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateLocalConfig.loading = true;
    state.apiResponses.updateLocalConfig.error = null;

    return state;
  },
);

export const updateLocalConfigSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateLocalConfig.loading = false;

    return state;
  },
);

export const updateLocalConfigErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.updateLocalConfig.loading = false;
    state.apiResponses.updateLocalConfig.error = error;

    return state;
  },
);
