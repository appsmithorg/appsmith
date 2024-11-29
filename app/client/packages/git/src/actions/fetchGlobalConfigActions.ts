import type { GitArtifactPayloadAction, GitGlobalConfig } from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchGlobalConfigInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.globalConfig.loading = true;
    state.apiResponses.globalConfig.error = null;

    return state;
  },
);

export const fetchGlobalConfigSuccessAction = createSingleArtifactAction(
  (
    state,
    action: GitArtifactPayloadAction<{ globalConfig: GitGlobalConfig }>,
  ) => {
    state.apiResponses.globalConfig.loading = false;
    state.apiResponses.globalConfig.value = action.payload.globalConfig;

    return state;
  },
);

export const fetchGlobalConfigErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.apiResponses.globalConfig.loading = false;
    state.apiResponses.globalConfig.error = error;

    return state;
  },
);
