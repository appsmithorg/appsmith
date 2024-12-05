import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitLocalConfig,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchLocalConfigInitAction = createSingleArtifactAction(
  (state) => {
    state.apiResponses.localConfig.loading = true;
    state.apiResponses.localConfig.error = null;

    return state;
  },
);

export const fetchLocalConfigSuccessAction = createSingleArtifactAction(
  (
    state,
    action: GitArtifactPayloadAction<{ localConfig: GitLocalConfig }>,
  ) => {
    state.apiResponses.localConfig.loading = false;
    state.apiResponses.localConfig.value = action.payload.localConfig;

    return state;
  },
);

export const fetchLocalConfigErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.localConfig.loading = false;
    state.apiResponses.localConfig.error = error;

    return state;
  },
);
