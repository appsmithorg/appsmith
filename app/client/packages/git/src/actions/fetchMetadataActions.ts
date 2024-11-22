import type { GitArtifactPayloadAction, GitMetadata } from "../types";
import { createSingleArtifactAction } from "./helpers/createSingleArtifactAction";

export const fetchMetadataInitAction = createSingleArtifactAction((state) => {
  state.metadata.loading = true;
  state.metadata.error = null;

  return state;
});

export const fetchMetadataSuccessAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ metadata: GitMetadata }>) => {
    state.metadata.loading = false;
    state.metadata.value = action.payload.metadata;

    return state;
  },
);

export const fetchMetadataErrorAction = createSingleArtifactAction(
  (state, action: GitArtifactPayloadAction<{ error: string }>) => {
    const { error } = action.payload;

    state.metadata.loading = false;
    state.metadata.error = error;

    return state;
  },
);
