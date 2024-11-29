import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";
import type { GitArtifactPayloadAction } from "../types";

export const updateGlobalConfigInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateGlobalConfig.loading = true;
    state.apiResponses.updateGlobalConfig.error = null;

    return state;
  },
);

export const updateGlobalConfigSuccessAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.updateGlobalConfig.loading = false;

    return state;
  },
);

export const updateGlobalConfigErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.updateGlobalConfig.loading = false;
    state.apiResponses.updateGlobalConfig.error = error;

    return state;
  },
);
