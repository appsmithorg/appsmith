import { createArtifactAction } from "../helpers/createArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export const gitImportInitAction = createArtifactAction((state) => {
  state.apiResponses.gitImport.loading = true;
  state.apiResponses.gitImport.error = null;

  return state;
});

export const gitImportSuccessAction = createArtifactAction((state) => {
  state.apiResponses.gitImport.loading = false;

  return state;
});

export const gitImportErrorAction = createArtifactAction<GitAsyncErrorPayload>(
  (state, action) => {
    const { error } = action.payload;

    state.apiResponses.gitImport.loading = false;
    state.apiResponses.gitImport.error = error;

    return state;
  },
);
