import { createSingleArtifactAction } from "../helpers/createSingleArtifactAction";
import type { GitAsyncErrorPayload } from "../types";

export const gitImportInitAction = createSingleArtifactAction((state) => {
  state.apiResponses.gitImport.loading = true;
  state.apiResponses.gitImport.error = null;

  return state;
});

export const gitImportSuccessAction = createSingleArtifactAction((state) => {
  state.apiResponses.gitImport.loading = false;

  return state;
});

export const gitImportErrorAction =
  createSingleArtifactAction<GitAsyncErrorPayload>((state, action) => {
    const { error } = action.payload;

    state.apiResponses.gitImport.loading = false;
    state.apiResponses.gitImport.error = error;

    return state;
  });
