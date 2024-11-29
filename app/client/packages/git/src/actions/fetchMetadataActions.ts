import type {
  GitArtifactPayloadAction,
  GitArtifactErrorPayloadAction,
  GitMetadata,
} from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchMetadataInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.metadata.loading = true;
  state.apiResponses.metadata.error = null;

  return state;
});

export const fetchMetadataSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ metadata: GitMetadata }>) => {
    state.apiResponses.metadata.loading = false;
    state.apiResponses.metadata.value = action.payload.metadata;

    return state;
  },
);

export const fetchMetadataErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactErrorPayloadAction) => {
    const { error } = action.payload;

    state.apiResponses.metadata.loading = false;
    state.apiResponses.metadata.error = error;

    return state;
  },
);
