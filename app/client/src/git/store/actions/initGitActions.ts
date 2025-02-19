import type { GitArtifact } from "git/types";
import { createArtifactAction } from "../helpers/createArtifactAction";

export interface InitGitForEditorPayload {
  artifact: GitArtifact | null;
}

export const initGitForEditorAction =
  createArtifactAction<InitGitForEditorPayload>((state) => {
    // need to do this to avoid mutation, bug with redux-toolkit immer
    const ui = {
      ...state.ui,
      initializing: true,
      initialized: false,
    };

    return { ...state, ui };
  });

export const initGitForEditorSuccessAction = createArtifactAction((state) => {
  state.ui.initializing = false;
  state.ui.initialized = true;

  return state;
});
